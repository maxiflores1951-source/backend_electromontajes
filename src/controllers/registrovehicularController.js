const registrovehicularService = require('../services/registrovehicularService');

const create = async (req, res) => {
  try {
    const codigo = await registrovehicularService.create(req.body);
    res.status(201).json({ mensaje: 'Registro vehicular insertado con éxito', codigo });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Error al insertar el movimiento')) {
      return res.status(500).json({ error: error.message });
    }
    console.error('Error al insertar registro vehicular:', error);
    res.status(500).json({ error: 'Error al insertar el registro vehicular' });
  }
};

const getMovimientos = async (req, res) => {
  try {
    const registros = await registrovehicularService.getMovimientos();
    res.json(registros);
  } catch (error) {
    console.error('Error al obtener movimientos de vehículos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos de vehículos' });
  }
};

module.exports = {
  create,
  getMovimientos,
};
