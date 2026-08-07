const billetesService = require('../services/billetesService');

const getAll = async (req, res) => {
  try {
    const billetes = await billetesService.getAll();
    res.json(billetes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
};
