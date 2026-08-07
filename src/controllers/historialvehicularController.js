const historialvehicularService = require('../services/historialvehicularService');

const create = async (req, res) => {
  try {
    const { codigoHistorial, importeTotal } = await historialvehicularService.create(req.body, req.idPersonal);
    res.status(201).json({
      mensaje: 'Historial vehicular creado correctamente',
      codigoHistorial,
      importeTotal,
    });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({
      error: 'Error al procesar el historial vehicular',
      detalle: err.message,
    });
  }
};

const getAll = async (req, res) => {
  try {
    const historiales = await historialvehicularService.getAll();
    res.json(historiales);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  create,
  getAll,
};
