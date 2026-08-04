const lugarService = require('../services/lugarService');

const getAll = async (req, res) => {
  try {
    const lugares = await lugarService.getAll();
    res.json(lugares);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll };
