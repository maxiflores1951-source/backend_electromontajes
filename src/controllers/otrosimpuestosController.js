const otrosimpuestosService = require('../services/otrosimpuestosService');

const getAll = async (req, res) => {
  try {
    const otrosimpuestos = await otrosimpuestosService.getAll();
    res.json(otrosimpuestos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
};
