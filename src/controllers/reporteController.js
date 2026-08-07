const reporteService = require('../services/reporteService');

const getFormasPago = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const rows = await reporteService.getFormasPago(desde, hasta);
    res.json(rows);
  } catch (error) {
    if (error.message.includes('Faltan las fechas desde y hasta')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error ejecutando consulta de formas de pago:', error);
    res.status(500).json({ error: 'Error al obtener formas de pago' });
  }
};

module.exports = {
  getFormasPago,
};
