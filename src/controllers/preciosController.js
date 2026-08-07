const preciosService = require('../services/preciosService');

const create = async (req, res) => {
  try {
    const id = await preciosService.create(req.body);
    res.json({ message: 'Precio registrado con éxito', id });
  } catch (err) {
    if (err.message.includes('Faltan datos obligatorios')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error interno al registrar historial' });
  }
};

module.exports = {
  create,
};
