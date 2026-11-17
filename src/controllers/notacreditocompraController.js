const notacreditocompraService = require('../services/notacreditocompraService');

const create = async (req, res) => {
  try {
    const resultado = await notacreditocompraService.create(req.body, req.idPersonal);
    res.status(201).json({
      mensaje: 'Nota de crédito creada correctamente',
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
    console.error('Error al insertar nota de crédito:', error);
    res.status(500).json({ error: 'Error al procesar la nota de crédito', detalles: error.message });
  }
};

const update = async (req, res) => {
  try {
    const resultado = await notacreditocompraService.update(
      req.params.codigo,
      req.body,
      req.idPersonal
    );
    res.json({
      mensaje: 'Nota de crédito actualizada correctamente',
      ...resultado,
    });
  } catch (error) {
    if (
      error.message.includes('Faltan datos obligatorios') ||
      error.message.includes('Datos incompletos') ||
      error.message.includes('no existe') ||
      error.message.includes('no se puede') ||
      error.message.includes('no puede ser menor') ||
      error.message.includes('debe ser mayor a 0')
    ) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al actualizar la nota de crédito:', error);
    res.status(500).json({ error: 'Error al actualizar la nota de crédito', detalles: error.message });
  }
};

const imputar = async (req, res) => {
  try {
    const resultado = await notacreditocompraService.imputar(
      req.params.codigo,
      req.body
    );
    res.json({
      mensaje: 'Nota de crédito imputada correctamente',
      ...resultado,
    });
  } catch (error) {
    console.error('Error al imputar la nota de crédito:', error);
    res.status(400).json({ message: error.message });
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

const getImputaciones = async (req, res) => {
  try {
    const imputaciones = await notacreditocompraService.getImputaciones();
    res.json(imputaciones);
  } catch (error) {
    console.error('Error al obtener las imputaciones de notas de crédito:', error);
    res.status(500).json({
      error: 'Error al obtener las imputaciones de notas de crédito',
      details: error.message,
    });
  }
};

module.exports = {
  create,
  update,
  imputar,
  getAll,
  getImputaciones,
};
