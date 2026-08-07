const familiaconceptoService = require('../services/familiaconceptoService');

const getAll = async (req, res) => {
  try {
    const familias = await familiaconceptoService.getAll();
    res.json(familias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
};
