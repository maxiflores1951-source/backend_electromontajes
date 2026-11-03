const valoresService = require('../services/valoresService');

const getAll = async (req, res) => {
  try {
    const valores = await valoresService.getAll();
    res.json(valores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getExceptoCodigo1 = async (req, res) => {
  try {
    const valores = await valoresService.getExceptoCodigo1();
    res.json(valores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const result = await valoresService.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const result = await valoresService.update(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await valoresService.remove(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  getExceptoCodigo1,
  create,
  update,
  remove,
};
