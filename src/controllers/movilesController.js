const movilesService = require('../services/movilesService');

const getAll = async (req, res) => {
  try {
    const moviles = await movilesService.getAll();
    res.json(moviles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
};
