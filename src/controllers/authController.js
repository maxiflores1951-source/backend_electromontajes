const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    const resultado = await authService.login(usuario, contrasena);
    res.json(resultado);
  } catch (error) {
    if (error.message === 'Usuario no encontrado o inactivo' || error.message === 'Contraseña incorrecta') {
      return res.status(401).json({ mensaje: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { login };