const familiaArticuloService = require('../services/familiaArticuloService');

const getAll = async (req, res) => {
  try {
    const data = await familiaArticuloService.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll };
