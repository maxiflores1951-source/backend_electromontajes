const monedaService = require('../services/monedaService');

const getAll = async (req, res) => {
  try {
    const monedas = await monedaService.getAll();
    res.json(monedas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
};
