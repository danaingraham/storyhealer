import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify story belongs to user
    const story = await prisma.story.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        child: true,
        pages: {
          orderBy: { pageNumber: "asc" },
        },
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Generate PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Cover page
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text(story.title, pageWidth / 2, 60, { align: "center" });
    
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "normal");
    pdf.text(`A story for ${story.child.name}`, pageWidth / 2, 80, { align: "center" });
    
    pdf.setFontSize(12);
    pdf.text("Created with StoryHealer", pageWidth / 2, pageHeight - 30, { align: "center" });

    // Helper function to fetch and convert image to base64
    const fetchImageAsBase64 = async (imageUrl: string): Promise<{ data: string; width: number; height: number } | null> => {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) return null;
        
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        // Determine image type from URL or content-type
        const contentType = response.headers.get('content-type');
        let mimeType = 'image/jpeg'; // default
        if (contentType?.includes('png')) mimeType = 'image/png';
        else if (contentType?.includes('gif')) mimeType = 'image/gif';
        else if (contentType?.includes('webp')) mimeType = 'image/webp';
        
        // Try to get actual image dimensions from the buffer
        let width = 1024; // default fallback
        let height = 1024; // default fallback
        
        try {
          // Simple PNG dimension parsing (PNG signature: 89 50 4E 47)
          if (buffer.byteLength > 24) {
            const view = new DataView(buffer);
            if (view.getUint32(0) === 0x89504E47) { // PNG signature
              width = view.getUint32(16, false); // big endian
              height = view.getUint32(20, false); // big endian
            } else if (view.getUint16(0) === 0xFFD8) { // JPEG signature
              // For JPEG, we'll use a more complex approach or stick with square assumption
              // Most DALL-E images are 1024x1024, user uploads vary
              width = 1024;
              height = 1024;
            }
          }
        } catch (dimensionError) {
          console.log('Could not parse image dimensions, using defaults');
          // Keep default values
        }
        
        return {
          data: `data:${mimeType};base64,${base64}`,
          width,
          height
        };
      } catch (error) {
        console.error('Error fetching image:', error);
        return null;
      }
    };

    // Story pages
    for (const page of story.pages) {
      pdf.addPage();
      
      // Page number
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Page ${page.pageNumber}`, pageWidth / 2, margin, { align: "center" });
      
      // Image section
      const imageUrl = page.userUploadedImageUrl || page.illustrationUrl;
      let imageHeight = 0;
      
      if (imageUrl) {
        try {
          const imageResult = await fetchImageAsBase64(imageUrl);
          if (imageResult) {
            // Calculate image dimensions (maintain aspect ratio)
            const maxImageWidth = pageWidth - (margin * 2);
            const maxImageHeight = (pageHeight - 120) * 0.6; // 60% of available space for image
            
            // Calculate actual dimensions maintaining aspect ratio
            const originalAspectRatio = imageResult.width / imageResult.height;
            let finalWidth = maxImageWidth;
            let finalHeight = finalWidth / originalAspectRatio;
            
            // If height is too large, scale based on height instead
            if (finalHeight > maxImageHeight) {
              finalHeight = maxImageHeight;
              finalWidth = finalHeight * originalAspectRatio;
            }
            
            // Center the image horizontally
            const imageX = (pageWidth - finalWidth) / 2;
            
            // Add image to PDF with proper dimensions
            pdf.addImage(imageResult.data, 'JPEG', imageX, margin + 20, finalWidth, finalHeight);
            imageHeight = finalHeight + 10; // Add some spacing
          }
        } catch (error) {
          console.error(`Error adding image for page ${page.pageNumber}:`, error);
        }
      }
      
      // Story text (positioned below image)
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0); // Reset to black
      
      const lines = pdf.splitTextToSize(page.text, pageWidth - (margin * 2));
      const textY = margin + 30 + imageHeight; // Position text below image
      
      lines.forEach((line: string, index: number) => {
        const lineY = textY + (index * 8);
        // Make sure text doesn't go off the page
        if (lineY < pageHeight - margin) {
          pdf.text(line, pageWidth / 2, lineY, { align: "center" });
        }
      });
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${story.title}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}