const checklistService = require('../services/checklistService');

const getItemsConSecciones = async (req, res) => {
  try {
    const rows = await checklistService.getItemsConSecciones();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener items con secciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  try {
    const codigoChecklist = await checklistService.create(req.body, req.idPersonal);
    res.status(201).json({
      mensaje: 'Checklist guardado correctamente',
      codigo_checklist: codigoChecklist,
    });
  } catch (error) {
    if (error.message.includes('Faltan datos')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al guardar checklist:', error);
    res.status(500).json({ error: 'Error interno al guardar checklist', detalles: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const resultado = await checklistService.getAll();
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener checklists:', error);
    res.status(500).json({ error: 'Error interno al obtener checklists' });
  }
};

module.exports = {
  getItemsConSecciones,
  create,
  getAll,
};
