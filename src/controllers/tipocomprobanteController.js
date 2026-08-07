const tipocomprobanteService = require('../services/tipocomprobanteService');

const getAll = async (req, res) => {
  try {
    const tipocomprobantes = await tipocomprobanteService.getAll();
    res.json(tipocomprobantes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCompra = async (req, res) => {
  try {
    const tipocomprobantes = await tipocomprobanteService.getCompra();
    res.json(tipocomprobantes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  getCompra,
};
