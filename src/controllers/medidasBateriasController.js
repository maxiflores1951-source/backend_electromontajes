const medidasBateriasService = require('../services/medidasBateriasService');

const getAll = async (req, res) => {
  try {
    const medidas = await medidasBateriasService.getAll();
    res.json(medidas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const medida = await medidasBateriasService.getById(req.params.id);
    res.json(medida);
  } catch (err) {
    if (err.message.includes('no encontrada')) {
      return res.status(404).json({ mensaje: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const medida = await medidasBateriasService.create(req.body.codigo_amperaje);
    res.status(201).json({ message: 'Medida de batería creada correctamente', medida });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const medida = await medidasBateriasService.update(req.params.id, req.body.codigo_amperaje);
    res.status(200).json({ message: 'Medida de batería actualizada correctamente', medida });
  } catch (err) {
    if (err.message.includes('no encontrada')) {
      return res.status(404).json({ mensaje: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await medidasBateriasService.remove(req.params.id);
    res.status(200).json({ message: 'Medida de batería eliminada correctamente', result });
  } catch (err) {
    if (err.message.includes('no encontrada')) {
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
