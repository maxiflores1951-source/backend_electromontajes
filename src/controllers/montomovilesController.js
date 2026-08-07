const montomovilesService = require('../services/montomovilesService');

const getMonto = async (req, res) => {
  try {
    const { fecha, tipo } = req.query;
    const monto = await montomovilesService.getMonto(fecha, tipo);
    res.json(monto);
  } catch (err) {
    if (err.message.includes('Faltan parámetros') || err.message.includes('Fecha inválida')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message.includes('No se encontró monto')) {
      return res.status(404).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  getMonto,
};
