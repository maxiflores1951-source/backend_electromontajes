const feriadosService = require('../services/feriadosService');

const getAll = async (req, res) => {
  try {
    const feriados = await feriadosService.getAll(req.query);
    res.json(feriados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const affectedRows = await feriadosService.create(req.body);
    res.json({ message: 'Feriados guardados correctamente', affectedRows });
  } catch (err) {
    if (err.message.includes('Se esperaba un array')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const affectedRows = await feriadosService.remove(req.query.year);
    res.json({ message: 'Feriados eliminados', affectedRows });
  } catch (err) {
    if (err.message.includes('year es requerido')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  create,
  remove,
};
