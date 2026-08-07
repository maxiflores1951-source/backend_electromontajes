const costosService = require('../services/costosService');

const getAll = async (req, res) => {
  try {
    const costos = await costosService.getAll();
    res.json(costos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const id = await costosService.create(req.body);
    res.json({ message: 'Oficio agregado exitosamente', id });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await costosService.remove(req.params.codigo);
    res.json({ message: 'Oficio eliminado exitosamente' });
  } catch (err) {
    if (err.message.includes('Código requerido')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    await costosService.update(req.params.codigo, req.body);
    res.json({ message: 'Oficio actualizado exitosamente' });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  create,
  remove,
  update,
};
