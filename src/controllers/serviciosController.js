const serviciosService = require('../services/serviciosService');

const getAll = async (req, res) => {
  try {
    const results = await serviciosService.getAll();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const result = await serviciosService.create(req.body);
    res.status(201).json({
      message: 'Servicio insertado correctamente',
      IDOBRA: result.IDOBRA,
      OBRA: result.OBRA,
      estado_id: result.estado_id,
    });
  } catch (err) {
    if (err.message.includes('Faltan datos')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error en insertar servicio:', err);
    res.status(500).json({ error: err.message });
  }
};

const getByCliente = async (req, res) => {
  try {
    const results = await serviciosService.getByCliente(req.query.codcli);
    res.json(results);
  } catch (err) {
    if (err.message.includes('Se requiere el parámetro')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const getEstadosObra = async (req, res) => {
  try {
    const results = await serviciosService.getEstadosObra();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const result = await serviciosService.update(req.params.IDOBRA, req.body);
    res.json({
      message: 'Servicio actualizado correctamente',
      IDOBRA: result.IDOBRA,
      OBRA: result.OBRA,
      CODCLI: result.CODCLI,
      estado_id: result.estado_id,
    });
  } catch (err) {
    if (err.message.includes('Faltan datos')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message.includes('No se encontró')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error en actualizar servicio:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  create,
  getByCliente,
  getEstadosObra,
  update,
};
