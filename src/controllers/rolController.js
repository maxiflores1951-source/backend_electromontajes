const rolService = require('../services/rolService');

const getAll = async (req, res) => {
  try {
    const roles = await rolService.getAll();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const rol = await rolService.getById(req.params.id);
    res.json(rol);
  } catch (err) {
    if (err.message.includes('No se encontró')) {
      res.status(404).json({ message: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = { getAll, getById };
