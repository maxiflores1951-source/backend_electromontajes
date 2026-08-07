const devolucionventaService = require('../services/devolucionventaService');

const insertarDevolucionVenta = async (req, res) => {
  try {
    const result = await devolucionventaService.insertarDevolucionVenta(req.body);
    res.status(201).json({
      mensaje: 'Devolución de venta insertada con éxito',
      codigo: result.codigo,
      codigo_nota_credito: result.codigo_nota_credito,
    });
  } catch (err) {
    if (err.message.includes('El código generado ya existe')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message.includes('Error al insertar el artículo')) {
      return res.status(500).json({ error: err.message });
    }
    console.error('Error al insertar devolución de venta:', err);
    res.status(500).json({ error: 'Error al insertar la devolución de venta' });
  }
};

const getRemitosArticulosPorServicio = async (req, res) => {
  try {
    const result = await devolucionventaService.getRemitosArticulosPorServicio(req.params.idServicio);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener artículos por servicio:', error);
    res.status(500).json({ error: 'Error al obtener los datos del servicio' });
  }
};

const getDevolucionesArticulosPorServicio = async (req, res) => {
  try {
    const result = await devolucionventaService.getDevolucionesArticulosPorServicio(req.params.idServicio);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener devoluciones por servicio:', error);
    res.status(500).json({ error: 'Error al obtener los datos de la devolución' });
  }
};

const getObtenerDevolucionesVenta = async (req, res) => {
  try {
    const devolucionesConArticulos = await devolucionventaService.getObtenerDevolucionesVenta();
    res.json(devolucionesConArticulos);
  } catch (error) {
    console.error('Error al obtener devoluciones de venta y artículos:', error);
    res.status(500).json({ error: 'Error al obtener devoluciones de venta y artículos' });
  }
};

const actualizarDevolucionVenta = async (req, res) => {
  try {
    const codigo = await devolucionventaService.actualizarDevolucionVenta(req.params.codigo, req.body);
    res.json({ mensaje: 'Devolución de venta actualizada con éxito', codigo });
  } catch (err) {
    if (err.message.includes('Devolución no encontrada')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error al actualizar devolución de venta:', err);
    res.status(500).json({ error: 'Error al actualizar la devolución de venta' });
  }
};

module.exports = {
  insertarDevolucionVenta,
  getRemitosArticulosPorServicio,
  getDevolucionesArticulosPorServicio,
  getObtenerDevolucionesVenta,
  actualizarDevolucionVenta,
};
