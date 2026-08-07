const cotizacionService = require('../services/cotizacionService');

const getAll = async (req, res) => {
  try {
    const results = await cotizacionService.getAll();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const id = await cotizacionService.create(req.body);
    res.json({ message: 'Cotización agregada exitosamente', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteById = async (req, res) => {
  try {
    await cotizacionService.deleteById(req.params.id);
    res.json({ message: 'Cotización eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getArticulos = async (req, res) => {
  const { codigo_cotizacion, codigo_detalle } = req.params;
  try {
    const results = await cotizacionService.getArticulos(codigo_cotizacion, codigo_detalle);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMateriales = async (req, res) => {
  try {
    const results = await cotizacionService.getMateriales();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  create,
  deleteById,
  getArticulos,
  getMateriales,
};
