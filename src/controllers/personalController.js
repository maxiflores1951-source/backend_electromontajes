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
    const created = await personalService.create(req.body, req.idPersonal);
    res.status(201).json({ message: 'Personal insertado exitosamente', id: created.id_personal ?? created.ID });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: err.message });
    } else {
      const status = err.message.includes('requerido') ? 400 : 500;
      res.status(status).json({ error: err.message });
    }
  }
};

const update = async (req, res) => {
  try {
    const updated = await personalService.update(req.params.id, req.body, req.idPersonal);
    res.status(200).json({ message: 'Personal actualizado correctamente', updated });
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

const remove = async (req, res) => {
  try {
    const affected = await personalService.remove(req.params.id);
    res.status(200).json({ message: 'Personal eliminado correctamente', deleted: affected });
  } catch (err) {
    if (err.message.includes('No se encontró')) {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Falta el ID')) {
      res.status(400).json({ message: err.message });
    } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      res.status(409).json({ error: 'No se puede eliminar: el personal está referenciado por otros registros' });
    } else {
      console.error('Error al eliminar personal:', err.message);
      res.status(500).json({ error: 'Error al eliminar personal', detail: err.message });
    }
  }
};

module.exports = { getAll, getById, insert, update, remove };
