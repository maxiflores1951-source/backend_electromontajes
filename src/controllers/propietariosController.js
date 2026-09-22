const propietariosService = require('../services/propietariosService');

const getAll = async (req, res) => {
  try {
    const propietarios = await propietariosService.getAll();
    res.json(propietarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const propietario = await propietariosService.getById(req.params.id);
    res.json(propietario);
  } catch (err) {
    if (err.message.includes('no encontrado')) {
      return res.status(404).json({ mensaje: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const propietario = await propietariosService.create(req.body.nombre);
    res.status(201).json({ message: 'Propietario creado correctamente', propietario });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const propietario = await propietariosService.update(req.params.id, req.body.nombre);
    res.status(200).json({ message: 'Propietario actualizado correctamente', propietario });
  } catch (err) {
    if (err.message.includes('no encontrado')) {
      return res.status(404).json({ mensaje: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await propietariosService.remove(req.params.id);
    res.status(200).json({ message: 'Propietario eliminado correctamente', result });
  } catch (err) {
    if (err.message.includes('no encontrado')) {
      return res.status(404).json({ mensaje: err.message });
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
