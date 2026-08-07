const pagosService = require('../services/pagosService');

const create = async (req, res) => {
  try {
    const codigo = await pagosService.create(req.body, req.idPersonal);
    res.status(201).json({
      mensaje: 'Orden de pago creada correctamente',
      codigo,
    });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({
      error: 'Error al procesar orden de pago',
      detalle: err.message,
    });
  }
};

const getAll = async (req, res) => {
  try {
    const ordenesPago = await pagosService.getAll();
    res.status(200).json({
      ordenes_pago: ordenesPago,
    });
  } catch (err) {
    console.error('Error al obtener órdenes de pago:', err);
    res.status(500).json({
      error: 'Error al obtener órdenes de pago',
      detalles: err.message,
    });
  }
};

const getByProveedor = async (req, res) => {
  const { id_proveedor, id_razon_social } = req.query;

  if (!id_proveedor || !id_razon_social) {
    return res.status(400).json({ error: 'Faltan parámetros: id_proveedor o id_razon_social' });
  }

  try {
    const pagosCompletos = await pagosService.getByProveedor(id_proveedor, id_razon_social);
    res.json(pagosCompletos);
  } catch (error) {
    console.error('Error al obtener pagos del proveedor:', error);
    res.status(500).json({
      error: 'Error al obtener pagos del proveedor',
      details: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getByProveedor,
};
