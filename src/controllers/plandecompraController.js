const plandecompraService = require('../services/plandecompraService');

const getAll = async (req, res) => {
  try {
    const planes = await plandecompraService.getAll();
    res.json(planes);
  } catch (err) {
    console.error('Error al consultar la base de datos:', err);
    res.status(500).send('Error en la base de datos');
  }
};

const create = async (req, res) => {
  try {
    const result = await plandecompraService.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const result = await plandecompraService.update(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await plandecompraService.remove(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};
