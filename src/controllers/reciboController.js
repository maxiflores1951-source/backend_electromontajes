const reciboService = require('../services/reciboService');

const create = async (req, res) => {
  try {
    const codigo = await reciboService.create(req.body);
    res.status(201).json({ mensaje: 'Recibo creado exitosamente', codigo });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error al crear recibo:', err);
    res.status(500).json({ error: 'Error al procesar recibo', detalles: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const recibos = await reciboService.getAll();
    res.status(200).json({ recibos });
  } catch (error) {
    console.error('Error al obtener recibos:', error);
    res.status(500).json({ error: 'Error al obtener recibos', detalles: error.message });
  }
};

const getImpuestosPorRazon = async (req, res) => {
  try {
    const results = await reciboService.getImpuestosPorRazon(
      req.query.idRazonSocial,
      req.query.desde,
      req.query.hasta
    );
    res.json(results);
  } catch (error) {
    if (error.message.includes('Faltan datos: idRazonSocial, desde o hasta')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al obtener los impuestos por razón social y fechas:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

const getImpuestosPorFecha = async (req, res) => {
  try {
    const results = await reciboService.getImpuestosPorFecha(req.query.desde, req.query.hasta);
    res.json(results);
  } catch (error) {
    if (error.message.includes('Faltan datos: desde o hasta')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al obtener los impuestos por fechas:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

const filtrar = async (req, res) => {
  try {
    const result = await reciboService.filtrar(req.query.desde, req.query.hasta);
    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('Faltan las fechas desde y hasta')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al filtrar recibos:', error);
    res.status(500).json({
      error: 'Error al filtrar recibos',
      detalles: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getImpuestosPorRazon,
  getImpuestosPorFecha,
  filtrar,
};
