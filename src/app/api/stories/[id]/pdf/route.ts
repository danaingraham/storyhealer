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
    const fetchImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
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
        
        return `data:${mimeType};base64,${base64}`;
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
          const imageData = await fetchImageAsBase64(imageUrl);
          if (imageData) {
            // Calculate image dimensions (maintain aspect ratio)
            const maxImageWidth = pageWidth - (margin * 2);
            const maxImageHeight = (pageHeight - 120) * 0.6; // 60% of available space for image
            
            // Add image to PDF
            pdf.addImage(imageData, 'JPEG', margin, margin + 20, maxImageWidth, maxImageHeight);
            imageHeight = maxImageHeight + 10; // Add some spacing
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