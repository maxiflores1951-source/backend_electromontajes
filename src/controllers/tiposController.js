const tiposService = require('../services/tiposService');

const getAll = async (req, res) => {
  try {
    const tipos = await tiposService.getAll();
    res.json(tipos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
};
