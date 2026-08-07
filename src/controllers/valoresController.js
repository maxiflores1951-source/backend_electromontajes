const valoresService = require('../services/valoresService');

const getAll = async (req, res) => {
  try {
    const valores = await valoresService.getAll();
    res.json(valores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getExceptoCodigo1 = async (req, res) => {
  try {
    const valores = await valoresService.getExceptoCodigo1();
    res.json(valores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  getExceptoCodigo1,
};
