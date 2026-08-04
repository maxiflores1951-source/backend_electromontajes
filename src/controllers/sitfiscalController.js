const sitfiscalService = require('../services/sitfiscalService');

const getAll = async (req, res) => {
  try {
    const sitfiscal = await sitfiscalService.getAll();
    res.json(sitfiscal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll };
