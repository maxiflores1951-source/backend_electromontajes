const familiaHerramientaService = require('../services/familiaHerramientaService');

const getAll = async (req, res) => {
  try {
    const data = await familiaHerramientaService.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll };
