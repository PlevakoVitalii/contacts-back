const multer = require('multer');
const path = require('path');

// задали шлях до тимчасової директорії
const tempDir = path.join(__dirname, "../", "temp");

// Задали параметри мідлвари и=малдеру
const multerConfig = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
  limits: {
    fieldSize: 2000000
  }
});

// створюємо цю мідлвару
const upload = multer({
  storage: multerConfig
});

module.exports = upload;

