const { PDFParse } = require("pdf-parse");

/**
 * Extrae texto de un PDF (buffer) usando pdf-parse v2 (clase PDFParse).
 */
const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text || "").trim();
  } finally {
    await parser.destroy();
  }
};

module.exports = { extractPdfText };
