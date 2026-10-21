const notadebitocompraService = require('../services/notadebitocompraService');

const create = async (req, res) => {
  try {
    const { codigoNotaDebito, id_factura_compra } = await notadebitocompraService.create(req.body, req.idPersonal);
    res.status(201).json({
      mensaje: 'Nota de débito creada correctamente',
      codigoNotaDebito,
      id_factura_compra: id_factura_compra || null
    });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios') || error.message.includes('Datos incompletos')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al insertar nota de débito:', error);
    res.status(500).json({ error: 'Error al procesar la nota de débito', detalles: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const notasDebitoCompletas = await notadebitocompraService.getAll();
    res.json(notasDebitoCompletas);
  } catch (error) {
    console.error('Error al obtener las notas de débito de compra:', error);
    res.status(500).json({
      error: 'Error al obtener las notas de débito de compra',
      details: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
};
