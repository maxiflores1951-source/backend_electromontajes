const seccionesService = require('../services/seccionesService');

const getAll = async (req, res) => {
  try {
    const secciones = await seccionesService.getAll();
    res.json(secciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
};
