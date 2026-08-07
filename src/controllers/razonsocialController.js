const razonsocialService = require('../services/razonsocialService');

const getAll = async (req, res) => {
  try {
    const razones = await razonsocialService.getAll();
    res.json(razones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
};
