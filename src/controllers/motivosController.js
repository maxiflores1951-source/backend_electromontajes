const motivosService = require('../services/motivosService');

const getAll = async (req, res) => {
  try {
    const motivos = await motivosService.getAll();
    res.json(motivos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
};
