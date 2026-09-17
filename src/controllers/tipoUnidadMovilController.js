const tipoUnidadMovilService = require('../services/tipoUnidadMovilService');

const getAll = async (req, res) => {
  try {
    const tipos = await tipoUnidadMovilService.getAll();
    res.json(tipos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getByCodigo = async (req, res) => {
  try {
    const tipo = await tipoUnidadMovilService.getByCodigo(req.params.codigo);
    res.json(tipo);
  } catch (err) {
    if (err.message.includes('no encontrado')) {
      return res.status(404).json({ mensaje: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const tipo = await tipoUnidadMovilService.create(req.body);
    res.status(201).json({ message: 'Tipo de unidad móvil creado correctamente', tipo });
  } catch (err) {
    if (err.message.includes('Faltan') || err.message.includes('No se pudo')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El tipo de unidad móvil ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const tipo = await tipoUnidadMovilService.update(req.params.codigo, req.body);
    res.status(200).json({ message: 'Tipo de unidad móvil actualizado correctamente', tipo });
  } catch (err) {
    if (err.message.includes('no encontrado')) {
      return res.status(404).json({ mensaje: err.message });
    }
    if (err.message.includes('Falta')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const tipo = await tipoUnidadMovilService.remove(req.params.codigo);
    res.status(200).json({ message: 'Tipo de unidad móvil eliminado correctamente', tipo });
  } catch (err) {
    if (err.message.includes('no encontrado')) {
      return res.status(404).json({ mensaje: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  getByCodigo,
  create,
  update,
  remove,
};
