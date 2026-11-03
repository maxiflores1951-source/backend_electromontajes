const planCuentaService = require('../services/planCuentaService');

const getAll = async (req, res) => {
  try {
    const planes = await planCuentaService.getAllPlanes();
    res.json(planes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const newId = await planCuentaService.createPlan(req.body, req.idPersonal);
    res.status(201).json({
      message: 'Plan insertado exitosamente',
      id: newId
    });
  } catch (err) {
    const status = err.message.includes('requeridos') || err.message.includes('ya existe') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  try {
    const affected = await planCuentaService.updatePlan(id, req.body, req.idPersonal);
    res.status(200).json({
      message: 'Plan actualizado correctamente',
      updated: affected
    });
  } catch (err) {
    if (err.message.includes('No se encontró')) {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Falta el ID')) {
      res.status(400).json({ message: err.message });
    } else {
      console.error('Error al actualizar plan:', err.message);
      res.status(500).json({ error: 'Error al actualizar plan', detail: err.message });
    }
  }
};

const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const affected = await planCuentaService.deletePlan(id);
    res.status(200).json({
      message: 'Plan eliminado correctamente',
      deleted: affected
    });
  } catch (err) {
    if (err.message.includes('No se encontró')) {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Falta el ID')) {
      res.status(400).json({ message: err.message });
    } else {
      console.error('Error al eliminar plan:', err.message);
      res.status(500).json({ error: 'Error al eliminar plan', detail: err.message });
    }
  }
};

module.exports = { getAll, create, update, remove };