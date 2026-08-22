const eppVarianteService = require('../services/eppVarianteService');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

const getAll = async (req, res) => {
  try {
    const variantes = await eppVarianteService.getAll();
    res.json(variantes);
  } catch (err) {
    console.error('Error al consultar variantes:', err);
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const variante = await eppVarianteService.getById(req.params.id);
    if (!variante) return res.status(404).json({ error: 'Variante no encontrada' });
    res.json(variante);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const insertedId = await eppVarianteService.create(req.body, req.idPersonal);
    res.status(201).json({
      message: 'EPP variante creado correctamente',
      status: 'success',
      insertedId,
    });
  } catch (err) {
    if (err.message.includes('obligatorios') || err.message.includes('no existe')) {
      return res.status(400).json({ message: err.message, status: 'error' });
    }
    console.error('Error al crear EPP variante:', err);
    res.status(500).json({ message: 'Error al crear EPP variante', status: 'error' });
  }
};

const update = async (req, res) => {
  try {
    await eppVarianteService.update(req.params.id, req.body, req.idPersonal);
    res.json({
      message: 'EPP variante actualizado correctamente',
      status: 'success',
    });
  } catch (err) {
    if (err.message.includes('no existe')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const affected = await eppVarianteService.remove(req.params.id);
    if (affected === 0) return res.status(404).json({ error: 'Variante no encontrada' });
    res.json({ message: 'EPP variante eliminado correctamente', status: 'success' });
  } catch (err) {
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