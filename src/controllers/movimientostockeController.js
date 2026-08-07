const movimientostockeService = require('../services/movimientostockeService');

const create = async (req, res) => {
  try {
    const { codigo, movimiento_id } = await movimientostockeService.create(req.body, req.idPersonal);
    res.status(201).json({ mensaje: 'Movimiento insertado con éxito', codigo, movimiento_id });
  } catch (error) {
    if (
      error.message.includes('El código generado ya existe') ||
      error.message.includes('requeridos') ||
      error.message.includes('Debe incluir')
    ) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Error al insertar el detalle EPP')) {
      return res.status(500).json({ error: error.message });
    }
    console.error('Error al insertar movimiento:', error);
    res.status(500).json({ error: 'Error al insertar el movimiento' });
  }
};

const getAll = async (req, res) => {
  try {
    const movimientos = await movimientostockeService.getAll();
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener los movimientos:', error);
    res.status(500).json({ error: 'Error al obtener los movimientos' });
  }
};

module.exports = {
  create,
  getAll,
};
