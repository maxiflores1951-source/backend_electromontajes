const notacreditoventaService = require('../services/notacreditoventaService');

const create = async (req, res) => {
  try {
    const result = await notacreditoventaService.create(req.body, req.idPersonal);
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

const update = async (req, res) => {
  try {
    const resultado = await notacreditoventaService.update(req.params.codigo, req.body, req.idPersonal);
    res.json({
      mensaje: 'Nota de crédito de venta actualizada correctamente',
      ...resultado,
    });
  } catch (error) {
    if (
      error.message.includes('Faltan datos obligatorios') ||
      error.message.includes('Datos incompletos') ||
      error.message.includes('no existe') ||
      error.message.includes('no se puede aplicar') ||
      error.message.includes('debe ser mayor a 0')
    ) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al actualizar nota de crédito de venta:', error);
    res.status(500).json({
      error: 'Error al actualizar la nota de crédito de venta',
      detalles: error.message,
    });
  }
};

const imputar = async (req, res) => {
  try {
    const resultado = await notacreditoventaService.imputar(req.params.codigo, req.body);
    res.json({
      mensaje: 'Nota de crédito de venta imputada correctamente',
      ...resultado,
    });
  } catch (error) {
    console.error('Error al imputar la nota de crédito de venta:', error);
    res.status(400).json({ message: error.message });
  }
};

const getImputaciones = async (req, res) => {
  try {
    const imputaciones = await notacreditoventaService.getImputaciones();
    res.json(imputaciones);
  } catch (error) {
    console.error('Error al obtener las imputaciones de notas de crédito de venta:', error);
    res.status(500).json({
      error: 'Error al obtener las imputaciones de notas de crédito de venta',
      details: error.message,
    });
  }
};

module.exports = {
  create,
  getByCodigo,
  getAll,
  update,
  imputar,
  getImputaciones,
};
