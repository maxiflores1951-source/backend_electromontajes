const personalService = require('../services/personalService');

const getAll = async (req, res) => {
  try {
    const personal = await personalService.getAll();
    res.json(personal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const personal = await personalService.getById(req.params.id);
    res.json(personal);
  } catch (err) {
    if (err.message.includes('No se encontró')) {
      res.status(404).json({ message: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

const insert = async (req, res) => {
  try {
    const newId = await personalService.create(req.body, req.idPersonal);
    res.status(201).json({ message: 'Personal insertado exitosamente', id: newId });
  } catch (err) {
    const status = err.message.includes('requeridos') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const affected = await personalService.update(req.params.id, req.body, req.idPersonal);
    res.status(200).json({ message: 'Personal actualizado correctamente', updated: affected });
  } catch (err) {
    if (err.message.includes('No se encontró')) {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Falta el ID')) {
      res.status(400).json({ message: err.message });
    } else {
      console.error('Error al actualizar personal:', err.message);
      res.status(500).json({ error: 'Error al actualizar personal', detail: err.message });
    }
  }
};

module.exports = { getAll, getById, insert, update };
