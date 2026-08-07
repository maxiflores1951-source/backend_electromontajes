const notacreditoventaService = require('../services/notacreditoventaService');

const create = async (req, res) => {
  try {
    const result = await notacreditoventaService.create(req.body);
    res.status(201).json({
      mensaje: 'Nota de crédito de venta creada correctamente',
      codigoNotaCredito: result.codigoNotaCredito,
      detallesInsertados: result.detallesInsertados,
    });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error al insertar nota de crédito de venta:', err);
    res.status(500).json({
      error: 'Error al procesar la nota de crédito de venta',
      detalles: err.message,
    });
  }
};

const getByCodigo = async (req, res) => {
  try {
    const notaCredito = await notacreditoventaService.getByCodigo(req.params.codigo);
    res.json(notaCredito);
  } catch (error) {
    if (error.message.includes('Nota de crédito no encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al obtener nota de crédito:', error);
    res.status(500).json({ error: 'Error al obtener la nota de crédito', detalles: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const notasCreditoCompletas = await notacreditoventaService.getAll();
    res.json(notasCreditoCompletas);
  } catch (error) {
    console.error('Error al obtener notas de crédito de venta:', error);
    res.status(500).json({
      error: 'Error al obtener notas de crédito de venta',
      details: error.message,
    });
  }
};

module.exports = {
  create,
  getByCodigo,
  getAll,
};
