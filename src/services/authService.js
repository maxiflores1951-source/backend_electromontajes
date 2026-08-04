const userModel = require('../models/userModel');
const { comparePassword } = require('../utils/bcryptUtils');
const { generateToken } = require('../utils/jwtUtils');

const login = async (usuario, contrasena) => {
  const user = await userModel.findByUsername(usuario);
  if (!user) throw new Error('Usuario no encontrado o inactivo');

  const valid = await comparePassword(contrasena, user.contrasena);
  if (!valid) throw new Error('Contraseña incorrecta');

  try {
    await userModel.updateLastLogin(user.id);
  } catch (err) {
    console.error('Error al actualizar último login:', err);
  }

  const token = generateToken({ id: user.id, usuario: user.usuario, rol: user.id_rol, id_personal: user.id_personal });

  return {
    mensaje: 'Login exitoso',
    token,
    id: user.id,
    usuario: user.usuario,
    id_rol: user.id_rol,
    rol_nombre: user.rol_nombre,
    id_personal: user.id_personal,
    nombre_personal: user.nombre_personal
  };
};

module.exports = { login };