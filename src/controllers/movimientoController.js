const movimientoService = require('../services/movimientoService');

const create = async (req, res) => {
  try {
    const codigo = await movimientoService.create(req.body);
    res.status(201).json({
      mensaje: 'Movimiento insertado con éxito',
      movimiento_id: codigo
    });
  } catch (err) {
    if (err.message.includes('requeridos') || err.message.includes('al menos')) {
      res.status(400).json({ error: err.message });
    } else {
      console.error('Error al insertar movimiento:', err.message);
      res.status(500).json({ error: 'Error al insertar el movimiento' });
    }
  }
};

const getAll = async (req, res) => {
  try {
    const rows = await movimientoService.getAll();
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al recuperar movimientos:', error.message);
    res.status(500).json({
      error: 'Error al recuperar los movimientos',
      details: error.message
    });
  }
};

module.exports = { create, getAll };
