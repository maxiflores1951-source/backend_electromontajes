const db = require('../../db');

const findByUsername = async (usuario) => {
  const [rows] = await db.execute(
    `SELECT u.id, u.usuario, u.contrasena, u.id_personal, u.activo, u.id_rol, r.nombre AS rol_nombre,
            p.NOMBRE AS nombre_personal
     FROM usuarios u
     INNER JOIN roles r ON u.id_rol = r.id
     LEFT JOIN personal p ON u.id_personal = p.ID
     WHERE u.usuario = ? AND u.activo = 1`,
    [usuario]
  );
  return rows[0];
};

const updateLastLogin = async (userId) => {
  await db.execute('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [userId]);
};

module.exports = { findByUsername, updateLastLogin };