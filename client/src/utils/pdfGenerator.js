import jsPDF from "jspdf";

/**
 * Generates a PDF from the analysis data
 * @param {Object} analysisData - The analysis data
 * @param {string} asin - The Amazon ASIN
 * @param {string} keyword - The search keyword
 * @returns {Promise<jsPDF>} - Promise resolving to the generated PDF document
 */
export const generateAnalysisPDF = async (analysisData, asin, keyword) => {
  // Create new PDF document
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;

  // Branding header
  pdf.setFillColor(34, 87, 122); // Brand blue
  pdf.rect(0, 0, pageWidth, 18, "F");
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Amazon Product Synthesis Tool", margin, 12);

  // Title section
  pdf.setFontSize(16);
  pdf.setTextColor(34, 87, 122);
  pdf.text(`📊 Product Analysis Report`, margin, 28);
  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);
  pdf.text(`ASIN: ${asin}   |   Keyword: ${keyword}   |   Generated: ${new Date().toLocaleDateString()}`, margin, 34);

  // Divider
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, 37, pageWidth - margin, 37);

  let yPos = 44;
  // Product Summary
  if (analysisData.product_summary) {
    pdf.setFontSize(14);
    pdf.setTextColor(34, 87, 122);
    pdf.text("📝 Product Summary", margin, yPos);
    yPos += 8;
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const description = analysisData.product_summary.description || "No description available";
    const wrappedText = pdf.splitTextToSize(description, pageWidth - 2 * margin);
    pdf.text(wrappedText, margin, yPos);
    yPos += wrappedText.length * 5 + 8;
    if (analysisData.product_summary.main_problems) {
      pdf.setFontSize(12);
      pdf.setTextColor(200, 100, 0);
      pdf.text("⚠️ Main Problems", margin, yPos);
      yPos += 7;
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      const problems = analysisData.product_summary.main_problems;
      const wrappedProblems = pdf.splitTextToSize(problems, pageWidth - 2 * margin);
      pdf.text(wrappedProblems, margin, yPos);
      yPos += wrappedProblems.length * 5 + 8;
    }
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 7;
  }
  if (analysisData.product_summary) {
    pdf.setFontSize(16);
    pdf.text("Product Summary", margin, yPos);
    yPos += 10;

    pdf.setFontSize(11);
    const description =
      analysisData.product_summary.description || "No description available";
    const wrappedText = pdf.splitTextToSize(
      description,
      pageWidth - 2 * margin
    );
    pdf.text(wrappedText, margin, yPos);
    yPos += wrappedText.length * 5 + 10;

    // Add main problems
    if (analysisData.product_summary.main_problems) {
      pdf.setFontSize(14);
      pdf.text("Main Problems", margin, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      const problems = analysisData.product_summary.main_problems;
      const wrappedProblems = pdf.splitTextToSize(
        problems,
        pageWidth - 2 * margin
      );
      pdf.text(wrappedProblems, margin, yPos);
      yPos += wrappedProblems.length * 5 + 10;
    }
  }

  // Check if we need a new page
  if (yPos > pageHeight - 40) {
    pdf.addPage();
    yPos = margin + 10;
  }

  // Add main product pros and cons
  if (analysisData.main_product) {
    pdf.setFontSize(14);
    pdf.setTextColor(34, 87, 122);
    pdf.text("🔍 Main Product Analysis", margin, yPos);
    yPos += 8;
    // Pros
    pdf.setFontSize(12);
    pdf.setTextColor(30, 150, 30);
    pdf.text("✓ Pros", margin, yPos);
    yPos += 7;
    const pros = analysisData.main_product.pros || [];
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    pros.forEach((pro, index) => {
      const wrappedPro = pdf.splitTextToSize(`• ${pro}`, pageWidth - 2 * margin - 5);
      pdf.text(wrappedPro, margin + 5, yPos);
      yPos += wrappedPro.length * 5 + 2;
      if (yPos > pageHeight - 20 && index < pros.length - 1) {
        pdf.addPage();
        yPos = margin + 10;
      }
    });
    yPos += 3;
    // Cons
    pdf.setFontSize(12);
    pdf.setTextColor(200, 50, 50);
    pdf.text("⚠️ Cons", margin, yPos);
    yPos += 7;
    const cons = analysisData.main_product.cons || [];
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    cons.forEach((con, index) => {
      const wrappedCon = pdf.splitTextToSize(`• ${con}`, pageWidth - 2 * margin - 5);
      pdf.text(wrappedCon, margin + 5, yPos);
      yPos += wrappedCon.length * 5 + 2;
      if (yPos > pageHeight - 20 && index < cons.length - 1) {
        pdf.addPage();
        yPos = margin + 10;
      }
    });
    yPos += 8;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 7;
  }

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = margin + 10;
  }

  // Add competitor analysis
  if (analysisData.competitors && analysisData.competitors.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(34, 87, 122);
    pdf.text("📊 Competitor Analysis", margin, yPos);
    yPos += 8;
    analysisData.competitors.forEach((competitor, index) => {
      if (yPos > pageHeight - 80) {
        pdf.addPage();
        yPos = margin + 10;
      }
      pdf.setFontSize(12);
      pdf.setTextColor(34, 87, 122);
      pdf.text(`Competitor ${index + 1}: ${competitor.identifier || ""}`, margin, yPos);
      yPos += 7;
      pdf.setFontSize(11);
      pdf.setTextColor(30, 150, 30);
      pdf.text("✓ Pros:", margin + 5, yPos);
      yPos += 6;
      const compPros = competitor.pros || [];
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      compPros.forEach((pro, idx) => {
        const wrappedPro = pdf.splitTextToSize(`• ${pro}`, pageWidth - 2 * margin - 10);
        pdf.text(wrappedPro, margin + 10, yPos);
        yPos += wrappedPro.length * 5 + 2;
        if (yPos > pageHeight - 20 && idx < compPros.length - 1) {
          pdf.addPage();
          yPos = margin + 10;
        }
      });
      yPos += 2;
      pdf.setFontSize(11);
      pdf.setTextColor(200, 50, 50);
      pdf.text("⚠️ Cons:", margin + 5, yPos);
      yPos += 6;
      const compCons = competitor.cons || [];
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      compCons.forEach((con, idx) => {
        const wrappedCon = pdf.splitTextToSize(`• ${con}`, pageWidth - 2 * margin - 10);
        pdf.text(wrappedCon, margin + 10, yPos);
        yPos += wrappedCon.length * 5 + 2;
        if (yPos > pageHeight - 20 && idx < compCons.length - 1) {
          pdf.addPage();
          yPos = margin + 10;
        }
      });
      yPos += 7;
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;
    });
  }

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = margin + 10;
  }

  // Add key recommendations
  if (analysisData.key_changes_for_sales && analysisData.key_changes_for_sales.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(34, 87, 122);
    pdf.text("🧠 Key Recommendations", margin, yPos);
    yPos += 8;
    const recommendations = analysisData.key_changes_for_sales;
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    recommendations.forEach((rec, index) => {
      const wrappedRec = pdf.splitTextToSize(`• ${rec}`, pageWidth - 2 * margin - 5);
      pdf.text(wrappedRec, margin + 5, yPos);
      yPos += wrappedRec.length * 5 + 2;
      if (yPos > pageHeight - 20 && index < recommendations.length - 1) {
        pdf.addPage();
        yPos = margin + 10;
      }
    });
    yPos += 7;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 7;
  }

  // Add footer to every page
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `Amazon Product Synthesis Tool  |  Page ${i} of ${totalPages}  |  ASIN: ${asin}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return pdf;
};

/**
 * Saves the PDF to a file and triggers download
 * @param {jsPDF} pdf - The generated PDF document
 * @param {string} asin - The Amazon ASIN
 */
export const downloadPDF = (pdf, asin) => {
  console.log(`Downloading PDF for ASIN: ${asin}`);
  pdf.save(`${asin}_analysis.pdf`);
};

/**
 * Main function to generate and download a PDF from the analysis data
 * @param {Object} analysisData - The analysis data
 * @param {string} asin - The Amazon ASIN
 * @param {string} keyword - The search keyword
 * @param {boolean} isAutoExport - Whether this is an automatic export (for logging)
 */
export const generateAndDownloadPDF = async (
  analysisData,
  asin,
  keyword,
  isAutoExport = false
) => {
  try {
    console.log(
      `CRITICAL PATH: Starting PDF generation for ${asin}, isAutoExport=${isAutoExport}`
    );

    // Double-check the preference right before generation
    if (isAutoExport) {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (
          userData &&
          userData.preferences &&
          userData.preferences.hasOwnProperty("autoExportPdf")
        ) {
          const autoExportPref = userData.preferences.autoExportPdf;
          console.log(
            `FINAL VERIFICATION: localStorage autoExportPdf = ${autoExportPref}`
          );

          if (autoExportPref === false) {
            console.log(
              "GENERATION BLOCKED: PDF auto-export is disabled in localStorage"
            );
            return false;
          }
        }
      } catch (error) {
        console.error("Error checking auto-export preference:", error);
      }
    }

    console.log(
      `PDF export triggered ${isAutoExport ? "automatically by user preference" : "manually by user"
      }`
    );
    const pdf = await generateAnalysisPDF(analysisData, asin, keyword);
    downloadPDF(pdf, asin);
    console.log(`PDF successfully generated and downloaded for ${asin}`);
    return true;
  } catch (error) {
    console.error(`Error generating PDF for ${asin}:`, error);
    return false;
  }
};
