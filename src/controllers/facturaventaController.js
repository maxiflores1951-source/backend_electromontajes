const facturaventaService = require('../services/facturaventaService');

const create = async (req, res) => {
  try {
    const result = await facturaventaService.create(req.body);
    res.status(201).json({
      mensaje: 'Factura de venta creada',
      codigo: result.codigo,
      presupuestos_vinculados: result.presupuestos_vinculados,
    });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error al crear factura venta:', err);
    res.status(500).json({ error: 'Error al procesar factura de venta', detalles: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const facturasCompletas = await facturaventaService.getAll();
    res.json(facturasCompletas);
  } catch (error) {
    console.error('Error al obtener facturas de venta:', error);
    res.status(500).json({
      error: 'Error al obtener facturas de venta',
      details: error.message,
    });
  }
};

const getByRazonSocial = async (req, res) => {
  try {
    const facturasCompletas = await facturaventaService.getByRazonSocial(req.params.id, req.query.periodo);
    res.json(facturasCompletas);
  } catch (error) {
    console.error('Error al obtener facturas por razón social:', error);
    res.status(500).json({
      error: 'Error al obtener facturas por razón social',
      details: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const codigo = await facturaventaService.update(req.params.codigo, req.body);
    res.status(200).json({ mensaje: 'Factura de venta actualizada correctamente', codigo });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error al actualizar factura venta:', err);
    res.status(500).json({ error: 'Error al actualizar factura de venta', detalles: err.message });
  }
};

const filtrar = async (req, res) => {
  try {
    const result = await facturaventaService.filtrar(req.query.desde, req.query.hasta);
    res.json(result);
  } catch (error) {
    if (error.message.includes('Faltan las fechas desde y hasta')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al filtrar facturas de venta:', error);
    res.status(500).json({ error: 'Error del servidor al filtrar facturas de venta' });
  }
};

const getByCliente = async (req, res) => {
  try {
    const facturasCompletas = await facturaventaService.getByCliente(req.params.id);
    res.json(facturasCompletas);
  } catch (error) {
    console.error('Error al obtener facturas por cliente:', error);
    res.status(500).json({
      error: 'Error al obtener facturas por cliente',
      details: error.message,
    });
  }
};

const getPorClienteRazonSocial = async (req, res) => {
  try {
    const documentosCompletos = await facturaventaService.getPorClienteRazonSocial(
      req.params.idCliente,
      req.params.idRazonSocial
    );
    res.json(documentosCompletos);
  } catch (error) {
    console.error('Error al obtener documentos por cliente y razón social:', error);
    res.status(500).json({ error: 'Error al obtener documentos por cliente y razón social' });
  }
};

const getCalendario = async (req, res) => {
  try {
    const facturasCompletas = await facturaventaService.getCalendario();
    res.json(facturasCompletas);
  } catch (error) {
    console.error('Error al obtener facturas de venta:', error);
    res.status(500).json({
      error: 'Error al obtener facturas de venta',
      details: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getByRazonSocial,
  update,
  filtrar,
  getByCliente,
  getPorClienteRazonSocial,
  getCalendario,
};
