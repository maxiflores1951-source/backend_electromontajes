const devolucioncompraService = require('../services/devolucioncompraService');

const create = async (req, res) => {
  try {
    const codigoDevolucion = await devolucioncompraService.create(req.body);
    res.status(201).json({
      mensaje: 'Devolución de compra insertada con éxito',
      codigoDevolucion,
      codigoRemito: codigoDevolucion
    });
  } catch (error) {
    if (error.message.includes('ya existe')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al insertar devolución de compra:', error);
    res.status(500).json({ error: 'Error al insertar la devolución de compra' });
  }
};

const getAll = async (req, res) => {
  try {
    const devolucionesConMovimientos = await devolucioncompraService.getAll();
    res.json(devolucionesConMovimientos);
  } catch (error) {
    console.error('Error al obtener las devoluciones de compra y movimientos:', error);
    res.status(500).json({ error: 'Error al obtener las devoluciones de compra y movimientos' });
  }
};

module.exports = {
  create,
  getAll,
};
