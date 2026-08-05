const herramientaMovimientoService = require('../services/herramientaMovimientoService');

const create = async (req, res) => {
  try {
    const movimientoId = await herramientaMovimientoService.create(req.body);
    res.status(201).json({ message: 'Movimiento de herramientas registrado con éxito', movimientoId });
  } catch (err) {
    if (err.message.includes('Faltan datos requeridos')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error en la transacción:', err.message);
    res.status(500).json({ error: 'Error al registrar el movimiento de herramientas' });
  }
};

const getAll = async (req, res) => {
  try {
    const rows = await herramientaMovimientoService.getAll();
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al recuperar movimientos de herramientas:', error.message);
    res.status(500).json({
      error: 'Error al recuperar los movimientos de herramientas',
      details: error.message,
    });
  }
};

module.exports = { create, getAll };
