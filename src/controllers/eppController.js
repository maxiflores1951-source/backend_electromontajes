const eppService = require('../services/eppService');

const getAll = async (req, res) => {
  try {
    const epps = await eppService.getAll();
    res.json(epps);
  } catch (err) {
    console.error('Error al consultar la base de datos:', err);
    res.status(500).send('Error en la base de datos');
  }
};

const getVariantes = async (req, res) => {
  try {
    const variantes = await eppService.getVariantes();
    res.json(variantes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const insertedId = await eppService.create(req.body, req.idPersonal);
    res.status(201).json({
      message: 'EPP insertado correctamente',
      status: 'success',
      insertedId,
    });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios') || err.message.includes('no existe')) {
      return res.status(400).json({ message: err.message, status: 'error' });
    }
    console.error('Error al insertar el EPP:', err);
    res.status(500).json({ message: 'Error al insertar el EPP', status: 'error' });
  }
};

const updateCantidad = async (req, res) => {
  try {
    await eppService.updateCantidad(req.params.codEpp, req.body.cantidad, req.body.tipo_operacion);
    res.status(200).json({
      message: `Cantidad de EPP actualizada correctamente (${req.body.tipo_operacion}).`,
    });
  } catch (err) {
    if (err.message.includes('inválido')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message.includes('EPP no encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Error al actualizar la cantidad de EPP', details: err.message });
  }
};

const updateCantidadFactura = async (req, res) => {
  try {
    const nuevaCantidad = await eppService.updateCantidadFactura(req.params.codEpp, req.body.cantidad);
    res.status(200).json({
      message: 'Cantidad actualizada correctamente.',
      nuevaCantidad,
    });
  } catch (err) {
    if (err.message.includes('mayor a 0')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message.includes('EPP no encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({
      error: 'Error al actualizar la cantidad de EPP',
      details: err.message,
    });
  }
};

module.exports = {
  getAll,
  getVariantes,
  create,
  updateCantidad,
  updateCantidadFactura,
};
