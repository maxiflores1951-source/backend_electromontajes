const herramientaMovimientoService = require('../services/herramientaMovimientoService');

const create = async (req, res) => {
  try {
    const movimientoId = await herramientaMovimientoService.create(req.body, req.idPersonal);
    res.status(201).json({ message: 'Movimiento de herramientas registrado con éxito', movimientoId });
  } catch (err) {
    if (err.message.includes('Faltan datos requeridos')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error en la transacción:', err.message);
    res.status(500).json({ error: 'Error al registrar el movimiento de herramientas' });
  }
};

const update = async (req, res) => {
  try {
    const movimientoId = await herramientaMovimientoService.update(req.params.movimientoId, req.body, req.idPersonal);
    res.status(200).json({ message: 'Movimiento de herramientas actualizado correctamente', movimientoId });
  } catch (err) {
    if (err.message.includes('Faltan datos requeridos')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message.includes('Movimiento no encontrado')) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    console.error('Error al actualizar movimiento de herramientas:', err.message);
    res.status(500).json({ error: 'Error al actualizar el movimiento de herramientas' });
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

module.exports = { create, update, getAll };
