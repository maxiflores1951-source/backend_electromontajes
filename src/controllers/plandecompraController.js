const plandecompraService = require('../services/plandecompraService');

const getAll = async (req, res) => {
  try {
    const planes = await plandecompraService.getAll();
    res.json(planes);
  } catch (err) {
    console.error('Error al consultar la base de datos:', err);
    res.status(500).send('Error en la base de datos');
  }
};

module.exports = {
  getAll,
};
