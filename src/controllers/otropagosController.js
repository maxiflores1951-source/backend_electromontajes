const otropagosService = require('../services/otropagosService');

const create = async (req, res) => {
  try {
    const codigo = await otropagosService.create(req.body, req.idPersonal);
    res.status(201).json({
      mensaje: 'Otros pagos registrados correctamente',
      codigo,
    });
  } catch (err) {
    if (err.message.includes('Faltan campos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error al registrar otros pagos:', err);
    res.status(500).json({ error: 'Error al registrar otros pagos', detalles: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const otrosPagos = await otropagosService.getAll();
    res.status(200).json(otrosPagos);
  } catch (error) {
    console.error('Error al obtener otros pagos:', error);
    res.status(500).json({ error: 'Error al consultar otros pagos', detalles: error.message });
  }
};

const getByCodigo = async (req, res) => {
  try {
    const pago = await otropagosService.getByCodigo(req.params.codigo);
    res.status(200).json(pago);
  } catch (err) {
    if (err.message.includes('Pago no encontrado')) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }
    console.error('Error al obtener el pago:', err);
    res.status(500).json({
      error: 'Error al consultar el pago',
      detalles: err.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const codigo = await otropagosService.update(req.params.codigo, req.body, req.idPersonal);
    res.status(200).json({
      mensaje: 'Otros pagos actualizados correctamente',
      codigo,
    });
  } catch (err) {
    if (err.message.includes('Faltan campos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error al actualizar otros pagos:', err);
    res.status(500).json({ error: 'Error al actualizar otros pagos', detalles: err.message });
  }
};

module.exports = {
  create,
  getAll,
  getByCodigo,
  update,
};
