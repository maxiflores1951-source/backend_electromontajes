const remitocompraService = require('../services/remitocompraService');

const create = async (req, res) => {
  try {
    const resultado = await remitocompraService.create(req.body);
    if (resultado.existe) {
      return res.status(200).json({
        message: 'El código ya existe, no se insertará un nuevo registro',
        codigoOrden: resultado.codigoOrden
      });
    }
    res.status(201).json({
      message: 'Remito de compra, movimientos y relaciones registrados con éxito',
      codigoOrden: resultado.codigoOrden
    });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios') || error.message.includes('activo') || error.message.includes('Datos incompletos')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al procesar la orden de compra:', error.message || error);
    res.status(500).json({
      error: 'Error al registrar la orden de compra',
      details: error.message
    });
  }
};

const getAll = async (req, res) => {
  try {
    const remitosConMovimientos = await remitocompraService.getAll();
    res.json(remitosConMovimientos);
  } catch (error) {
    console.error('Error al obtener los remitos de compra y movimientos:', error);
    res.status(500).json({ error: 'Error al obtener los remitos de compra y movimientos' });
  }
};

const getPorServicio = async (req, res) => {
  const { idServicio } = req.params;
  try {
    const remitos = await remitocompraService.getPorServicio(idServicio);
    res.json(remitos);
  } catch (error) {
    console.error('Error al obtener remitos por servicio:', error);
    res.status(500).json({ error: 'Error al obtener remitos por servicio' });
  }
};

const getSinOrden = async (req, res) => {
  try {
    const remitosConMovimientos = await remitocompraService.getSinOrden();
    res.json(remitosConMovimientos);
  } catch (error) {
    console.error('Error al obtener los remitos sin orden:', error);
    res.status(500).json({ error: 'Error al obtener los remitos sin orden' });
  }
};

const getResumen = async (req, res) => {
  try {
    const resultado = await remitocompraService.getResumen();
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener resumen de remitos:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de remitos de compra' });
  }
};

const update = async (req, res) => {
  const { codigo } = req.params;
  try {
    await remitocompraService.update(codigo, req.body);
    res.status(200).json({
      message: 'Remito de compra, movimientos y relaciones actualizados con éxito',
      codigo
    });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios') || error.message.includes('activo') || error.message.includes('Datos incompletos')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al actualizar la orden de compra:', error.message || error);
    res.status(500).json({
      error: 'Error al actualizar la orden de compra',
      details: error.message
    });
  }
};

const getSinFactura = async (req, res) => {
  try {
    const remitosConMovimientos = await remitocompraService.getSinFactura();
    res.json(remitosConMovimientos);
  } catch (error) {
    console.error('Error al obtener los remitos sin factura:', error);
    res.status(500).json({ error: 'Error al obtener los remitos sin factura' });
  }
};

module.exports = {
  create,
  getAll,
  getPorServicio,
  getSinOrden,
  getResumen,
  update,
  getSinFactura,
};
