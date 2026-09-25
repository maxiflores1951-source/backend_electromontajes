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

const getUltimoPrecio = async (req, res) => {
  try {
    const { cod_articulo } = req.params;
    const { cod_precio = 'PC0' } = req.query;
    const precio = await preciosService.getUltimoPrecio(cod_articulo, cod_precio);
    if (precio === null) {
      return res.status(404).json({ message: 'No hay historial de precios para este artículo' });
    }
    res.json({ precio });
  } catch (err) {
    res.status(500).json({ message: 'Error interno al obtener último precio' });
  }
};

module.exports = {
  create,
  getUltimoPrecio,
};
