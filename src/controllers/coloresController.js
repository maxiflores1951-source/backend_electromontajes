const coloresService = require('../services/coloresService');

const getAll = async (req, res) => {
  try {
    const colores = await coloresService.getAll();
    res.json(colores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const color = await coloresService.getById(req.params.id);
    res.json(color);
  } catch (err) {
    if (err.message.includes('Color no encontrado')) {
      return res.status(404).json({ mensaje: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const color = await coloresService.create(req.body);
    res.status(201).json({ id: color.id, nombre: color.nombre });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ mensaje: err.message });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'El color ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
};
