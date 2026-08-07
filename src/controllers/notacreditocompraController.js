const notacreditocompraService = require('../services/notacreditocompraService');

const create = async (req, res) => {
  try {
    const { codigoNotaCredito, id_factura_compra } = await notacreditocompraService.create(req.body, req.idPersonal);
    res.status(201).json({
      mensaje: 'Nota de crédito creada correctamente',
      codigoNotaCredito,
      id_factura_compra: id_factura_compra || null
    });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios') || error.message.includes('Datos incompletos')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al insertar nota de crédito:', error);
    res.status(500).json({ error: 'Error al procesar la nota de crédito', detalles: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const notasCreditoCompletas = await notacreditocompraService.getAll();
    res.json(notasCreditoCompletas);
  } catch (error) {
    console.error('Error al obtener las notas de crédito de compra:', error);
    res.status(500).json({
      error: 'Error al obtener las notas de crédito de compra',
      details: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
};
