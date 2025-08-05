import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Story pages
    for (const page of story.pages) {
      pdf.addPage();
      
      // Page number
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Page ${page.pageNumber}`, pageWidth / 2, margin, { align: "center" });
      
      // Story text
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      
      const lines = pdf.splitTextToSize(page.text, pageWidth - (margin * 2));
      const textY = pageHeight / 2;
      
      lines.forEach((line: string, index: number) => {
        pdf.text(line, pageWidth / 2, textY + (index * 8), { align: "center" });
      });
      
      // Note about illustrations
      if (page.userUploadedImageUrl || page.illustrationUrl) {
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text("(Illustration would appear here in digital version)", pageWidth / 2, pageHeight - 40, { align: "center" });
      }
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