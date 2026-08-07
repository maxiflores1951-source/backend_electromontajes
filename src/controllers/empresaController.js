const empresaService = require('../services/empresaService');

const getAll = async (req, res) => {
  try {
    const empresas = await empresaService.getAll();
    res.json(empresas);
  } catch (err) {
    console.error('Error al consultar la base de datos:', err);
    res.status(500).send('Error en la base de datos');
  }
};

const getById = async (req, res) => {
  try {
    const empresa = await empresaService.getById(req.params.id);
    res.json(empresa);
  } catch (err) {
    if (err.message.includes('Empresa no encontrada')) {
      return res.status(404).json({ message: err.message });
    }
    console.error('Error al consultar la base de datos:', err);
    res.status(500).send('Error en la base de datos');
  }
};

module.exports = {
  getAll,
  getById,
};
