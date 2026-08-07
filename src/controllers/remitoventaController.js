const remitoventaService = require('../services/remitoventaService');

const insertarRemitoVenta = async (req, res) => {
  try {
    const codigo = await remitoventaService.insertarRemitoVenta(req.body);
    res.status(201).json({ mensaje: 'Remito de venta insertado con éxito', codigo });
  } catch (err) {
    if (err.message.includes('El código generado ya existe')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message.includes('Error al insertar el artículo')) {
      return res.status(500).json({ error: err.message });
    }
    console.error('Error al insertar remito de venta:', err);
    res.status(500).json({ error: 'Error al insertar el remito de venta' });
  }
};

const getRemitoByCodigo = async (req, res) => {
  try {
    const result = await remitoventaService.getRemitoByCodigo(req.params.codigo);
    res.json(result);
  } catch (err) {
    if (err.message.includes('Remito no encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error al obtener remito:', err);
    res.status(500).json({ error: 'Error al obtener el remito' });
  }
};

const getObtenerRemitosVenta = async (req, res) => {
  try {
    const remitosConArticulos = await remitoventaService.getObtenerRemitosVenta();
    res.json(remitosConArticulos);
  } catch (error) {
    console.error('Error al obtener los remitos de venta y artículos:', error);
    res.status(500).json({ error: 'Error al obtener los remitos de venta y artículos' });
  }
};

const getArticulosPorServicio = async (req, res) => {
  try {
    const result = await remitoventaService.getArticulosPorServicio(req.params.idServicio);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener artículos por servicio:', error);
    res.status(500).json({ error: 'Error al obtener los datos del servicio' });
  }
};

const getMovimientosArticulos = async (req, res) => {
  try {
    const result = await remitoventaService.getMovimientosArticulos(
      req.query.idMotivo,
      req.query.idServicio,
      req.query.idMovil
    );
    res.json(result);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener los movimientos del servicio' });
  }
};

const actualizarPrecios = async (req, res) => {
  try {
    await remitoventaService.actualizarPrecios(req.body);
    res.json({ message: 'Precios actualizados correctamente.' });
  } catch (err) {
    if (err.message.includes('Datos inválidos o vacíos.') || err.message.includes('Faltan campos obligatorios.')) {
      return res.status(400).json({ message: err.message });
    }
    console.error('Error al actualizar precios:', err);
    res.status(500).json({ message: 'Error al actualizar precios.' });
  }
};

const getCostosRemitos = async (req, res) => {
  try {
    const result = await remitoventaService.getCostosRemitos(req.params.idServicio);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener movimientos filtrados:', error);
    res.status(500).json({
      error: 'Error al obtener los movimientos del servicio',
      details: error.message,
    });
  }
};

const actualizarRemitoVenta = async (req, res) => {
  try {
    const codigo = await remitoventaService.actualizarRemitoVenta(req.params.codigo, req.body);
    res.json({ mensaje: 'Remito de venta actualizado con éxito', codigo });
  } catch (err) {
    if (err.message.includes('Remito no encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error al actualizar remito de venta:', err);
    res.status(500).json({ error: 'Error al actualizar el remito de venta' });
  }
};

module.exports = {
  insertarRemitoVenta,
  getRemitoByCodigo,
  getObtenerRemitosVenta,
  getArticulosPorServicio,
  getMovimientosArticulos,
  actualizarPrecios,
  getCostosRemitos,
  actualizarRemitoVenta,
};
