const familiaeppService = require('../services/familiaeppService');

const getAll = async (req, res) => {
  try {
    const familias = await familiaeppService.getAll();
    res.json(familias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll };
