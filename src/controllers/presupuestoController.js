const presupuestoService = require('../services/presupuestoService');

const create = async (req, res) => {
  try {
    const codigo = await presupuestoService.create(req.body);
    res.status(201).json({
      mensaje: 'Presupuesto creado correctamente',
      codigo
    });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al crear presupuesto:', error);
    res.status(500).json({ error: 'Error al procesar presupuesto', detalles: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const presupuestosCompletos = await presupuestoService.getAll();
    res.json(presupuestosCompletos);
  } catch (error) {
    console.error('Error al obtener los presupuestos:', error);
    res.status(500).json({
      error: 'Error al obtener los presupuestos',
      details: error.message
    });
  }
};

const getFacturar = async (req, res) => {
  try {
    const { id_cliente, id_servicio } = req.query;
    const presupuestosCompletos = await presupuestoService.getFacturar(id_cliente, id_servicio);
    res.json(presupuestosCompletos);
  } catch (error) {
    console.error('Error al obtener los presupuestos:', error);
    res.status(500).json({
      error: 'Error al obtener los presupuestos',
      details: error.message
    });
  }
};

const getActivos = async (req, res) => {
  try {
    const { id_cliente } = req.query;
    const presupuestosCompletos = await presupuestoService.getActivos(id_cliente);
    res.json(presupuestosCompletos);
  } catch (error) {
    console.error('Error al obtener presupuestos activos:', error);
    res.status(500).json({
      error: 'Error al obtener presupuestos activos',
      details: error.message
    });
  }
};

const getConFacturas = async (req, res) => {
  try {
    const presupuestosCompletos = await presupuestoService.getConFacturas();
    res.json(presupuestosCompletos);
  } catch (error) {
    console.error('Error al obtener los presupuestos con facturas:', error);
    res.status(500).json({
      error: 'Error al obtener los presupuestos con facturas',
      details: error.message
    });
  }
};

module.exports = {
  create,
  getAll,
  getFacturar,
  getActivos,
  getConFacturas,
};
