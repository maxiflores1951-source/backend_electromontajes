const itemschecklistService = require('../services/itemschecklistService');

const getAll = async (req, res) => {
  try {
    const items = await itemschecklistService.getAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getByCodigoSeccion = async (req, res) => {
  try {
    const items = await itemschecklistService.getByCodigoSeccion(req.params.codigo_seccion);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  getByCodigoSeccion,
};
