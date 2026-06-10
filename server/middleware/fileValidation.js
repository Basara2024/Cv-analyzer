// Valida que el archivo sea realmente un PDF verificando su magic number
// Los PDFs siempre empiezan con %PDF- (bytes: 25 50 44 46 2D)
const validatePDF = (req, res, next) => {
  if (!req.file) return next();

  const buffer = req.file.buffer;

  // Verificar magic number del PDF
  if (
    buffer[0] !== 0x25 || // %
    buffer[1] !== 0x50 || // P
    buffer[2] !== 0x44 || // D
    buffer[3] !== 0x46    // F
  ) {
    return res.status(400).json({
      success: false,
      message: "El archivo no es un PDF válido.",
    });
  }

  // Verificar tamaño mínimo (un PDF vacío tiene al menos 100 bytes)
  if (buffer.length < 100) {
    return res.status(400).json({
      success: false,
      message: "El archivo PDF está vacío o corrupto.",
    });
  }

  // Verificar tamaño máximo (10MB)
  if (buffer.length > 10 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "El archivo excede el tamaño máximo de 10MB.",
    });
  }

  next();
};

module.exports = { validatePDF };
