const conceptoService = require('../services/conceptoService');

const getAll = async (req, res) => {
  try {
    const conceptos = await conceptoService.getAll();
    res.json(conceptos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getNextCode = async (req, res) => {
  try {
    const nextCode = await conceptoService.getNextCode(req.params.familyCode);
    res.json({ nextCode });
  } catch (err) {
    if (err.message.includes('Formato de código no válido')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getAll,
  getNextCode,
};
