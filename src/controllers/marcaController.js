const marcaService = require('../services/marcaService');

const getAll = async (req, res) => {
  try {
    const marcas = await marcaService.getAll();
    res.json(marcas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const newId = await marcaService.create(req.body, req.idPersonal);
    res.status(201).json({ message: 'Marca agregada exitosamente', id: newId });
  } catch (err) {
    const status = err.message.includes('requerido') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

module.exports = { getAll, create };
