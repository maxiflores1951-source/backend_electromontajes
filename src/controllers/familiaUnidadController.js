const familiaUnidadService = require('../services/familiaUnidadService');

const getAll = async (req, res) => {
  try {
    const unidades = await familiaUnidadService.getAll();
    res.json(unidades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getByCodigo = async (req, res) => {
  try {
    const unidad = await familiaUnidadService.getByCodigo(req.params.codigo);
    res.json(unidad);
  } catch (err) {
    const status = err.message.includes('No se encontró') ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    await familiaUnidadService.create(req.body, req.idPersonal);
    res.status(201).json({ message: 'Unidad creada exitosamente' });
  } catch (err) {
    const status = err.message.includes('requerido') || err.message.includes('ya existe') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    await familiaUnidadService.update(req.params.codigo, req.body, req.idPersonal);
    res.json({ message: 'Unidad actualizada exitosamente' });
  } catch (err) {
    const status = err.message.includes('No se encontró') ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await familiaUnidadService.remove(req.params.codigo);
    res.json({ message: 'Unidad eliminada exitosamente' });
  } catch (err) {
    const status = err.message.includes('No se encontró') ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
};

module.exports = { getAll, getByCodigo, create, update, remove };
