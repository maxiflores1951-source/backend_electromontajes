const viaticosService = require('../services/viaticosService');

const getAll = async (req, res) => {
  try {
    const viaticos = await viaticosService.getAll();
    res.json(viaticos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
};
