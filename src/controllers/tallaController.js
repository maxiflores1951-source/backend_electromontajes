const tallaService = require('../services/tallaService');

const getAll = async (req, res) => {
  try {
    const tallas = await tallaService.getAll();
    res.json(tallas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const talla = await tallaService.getById(req.params.id);
    res.json(talla);
  } catch (err) {
    if (err.message.includes('Talla no encontrada')) {
      return res.status(404).json({ mensaje: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const talla = await tallaService.create(req.body);
    res.status(201).json({ id: talla.id, nombre: talla.nombre });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ mensaje: err.message });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'La talla ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const talla = await tallaService.update(req.params.id, req.body);
    res.json({ mensaje: 'Talla actualizada correctamente', id: talla.id, nombre: talla.nombre });
  } catch (err) {
    if (err.message.includes('Talla no encontrada')) {
      return res.status(404).json({ mensaje: err.message });
    }
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ mensaje: err.message });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'La talla ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const id = await tallaService.remove(req.params.id);
    res.json({ mensaje: 'Talla eliminada correctamente', id });
  } catch (err) {
    if (err.message.includes('Talla no encontrada')) {
      return res.status(404).json({ mensaje: err.message });
    }
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        mensaje: 'No se puede eliminar la talla porque está siendo utilizada en otros registros',
      });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
