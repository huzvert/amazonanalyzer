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
  const margin = 10;

  // Add title
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Product Analysis: ${asin}`, margin, margin + 10);

  // Add keyword
  pdf.setFontSize(12);
  pdf.text(`Keyword: ${keyword}`, margin, margin + 20);
  pdf.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    margin,
    margin + 25
  );

  // Add divider
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, margin + 30, pageWidth - margin, margin + 30);

  // Add product summary
  let yPos = margin + 40;
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
    pdf.setFontSize(16);
    pdf.text("Main Product Analysis", margin, yPos);
    yPos += 10;

    // Pros
    pdf.setFontSize(14);
    pdf.text("Pros", margin, yPos);
    yPos += 8;

    const pros = analysisData.main_product.pros || [];
    pdf.setFontSize(11);
    pros.forEach((pro, index) => {
      const wrappedPro = pdf.splitTextToSize(
        `${index + 1}. ${pro}`,
        pageWidth - 2 * margin - 5
      );
      pdf.text(wrappedPro, margin + 5, yPos);
      yPos += wrappedPro.length * 5 + 3;

      // Check if we need a new page
      if (yPos > pageHeight - 20 && index < pros.length - 1) {
        pdf.addPage();
        yPos = margin + 10;
      }
    });

    yPos += 5;

    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = margin + 10;
    }

    // Cons
    pdf.setFontSize(14);
    pdf.text("Cons", margin, yPos);
    yPos += 8;

    const cons = analysisData.main_product.cons || [];
    pdf.setFontSize(11);
    cons.forEach((con, index) => {
      const wrappedCon = pdf.splitTextToSize(
        `${index + 1}. ${con}`,
        pageWidth - 2 * margin - 5
      );
      pdf.text(wrappedCon, margin + 5, yPos);
      yPos += wrappedCon.length * 5 + 3;

      // Check if we need a new page
      if (yPos > pageHeight - 20 && index < cons.length - 1) {
        pdf.addPage();
        yPos = margin + 10;
      }
    });

    yPos += 10;
  }

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = margin + 10;
  }

  // Add competitor analysis
  if (analysisData.competitors && analysisData.competitors.length > 0) {
    pdf.setFontSize(16);
    pdf.text("Competitor Analysis", margin, yPos);
    yPos += 10;

    analysisData.competitors.forEach((competitor, index) => {
      // Check if we need a new page
      if (yPos > pageHeight - 80) {
        pdf.addPage();
        yPos = margin + 10;
      }

      pdf.setFontSize(14);
      pdf.text(
        `Competitor ${index + 1}: ${competitor.identifier || ""}`,
        margin,
        yPos
      );
      yPos += 8;

      // Pros
      pdf.setFontSize(12);
      pdf.text("Pros:", margin + 5, yPos);
      yPos += 6;

      const compPros = competitor.pros || [];
      pdf.setFontSize(10);
      compPros.forEach((pro, idx) => {
        const wrappedPro = pdf.splitTextToSize(
          `• ${pro}`,
          pageWidth - 2 * margin - 10
        );
        pdf.text(wrappedPro, margin + 10, yPos);
        yPos += wrappedPro.length * 5 + 2;

        // Check if we need a new page
        if (yPos > pageHeight - 20 && idx < compPros.length - 1) {
          pdf.addPage();
          yPos = margin + 10;
        }
      });

      yPos += 3;

      // Cons
      pdf.setFontSize(12);
      pdf.text("Cons:", margin + 5, yPos);
      yPos += 6;

      const compCons = competitor.cons || [];
      pdf.setFontSize(10);
      compCons.forEach((con, idx) => {
        const wrappedCon = pdf.splitTextToSize(
          `• ${con}`,
          pageWidth - 2 * margin - 10
        );
        pdf.text(wrappedCon, margin + 10, yPos);
        yPos += wrappedCon.length * 5 + 2;

        // Check if we need a new page
        if (yPos > pageHeight - 20 && idx < compCons.length - 1) {
          pdf.addPage();
          yPos = margin + 10;
        }
      });

      yPos += 10;
    });
  }

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = margin + 10;
  }

  // Add key recommendations
  if (
    analysisData.key_changes_for_sales &&
    analysisData.key_changes_for_sales.length > 0
  ) {
    pdf.setFontSize(16);
    pdf.text("Key Recommendations", margin, yPos);
    yPos += 10;

    const recommendations = analysisData.key_changes_for_sales;
    pdf.setFontSize(11);
    recommendations.forEach((rec, index) => {
      const wrappedRec = pdf.splitTextToSize(
        `${index + 1}. ${rec}`,
        pageWidth - 2 * margin - 5
      );
      pdf.text(wrappedRec, margin + 5, yPos);
      yPos += wrappedRec.length * 5 + 3;

      // Check if we need a new page
      if (yPos > pageHeight - 20 && index < recommendations.length - 1) {
        pdf.addPage();
        yPos = margin + 10;
      }
    });
  }

  // Add footer to every page
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages} | Amazon Product Analysis | ASIN: ${asin}`,
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
      `PDF export triggered ${
        isAutoExport ? "automatically by user preference" : "manually by user"
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
