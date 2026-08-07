const reporteivaService = require('../services/reporteivaService');

const create = async (req, res) => {
  try {
    const codigo = await reporteivaService.create(req.body);
    res.status(201).json({
      message: 'Reporte IVA registrado correctamente',
      codigo,
    });
  } catch (err) {
    if (err.message.includes('Datos obligatorios faltantes') || err.message.includes('Código inválido')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error al registrar reporte IVA:', err);
    res.status(500).json({
      error: 'Error en el registro del reporte IVA',
      detalle: err.message,
    });
  }
};

const getAll = async (req, res) => {
  try {
    const reportesConFacturas = await reporteivaService.getAll();
    res.json(reportesConFacturas);
  } catch (error) {
    console.error('Error al obtener reporte IVA:', error);
    res.status(500).json({
      error: 'Error al obtener reportes IVA',
      details: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
};
