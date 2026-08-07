const reporteivaventasService = require('../services/reporteivaventasService');

const create = async (req, res) => {
  try {
    const codigo = await reporteivaventasService.create(req.body);
    res.status(201).json({
      message: 'Reporte IVA ventas registrado correctamente',
      codigo,
    });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error al registrar reporte IVA ventas:', err);
    res.status(500).json({ error: 'Error en el registro del reporte ventas', detalle: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const reportesConFacturas = await reporteivaventasService.getAll();
    res.json(reportesConFacturas);
  } catch (error) {
    console.error('Error al obtener reportes IVA ventas:', error);
    res.status(500).json({
      error: 'Error al obtener reportes IVA ventas',
      details: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
};
