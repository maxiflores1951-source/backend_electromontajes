const vehiculosService = require('../services/vehiculosService');

const getExclude = async (req, res) => {
  try {
    const vehiculos = await vehiculosService.getExclude(req.query.codigo);
    res.json(vehiculos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getExclude,
};
