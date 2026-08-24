const db = require('../../db');

// El rol del personal se obtiene desde la tabla `usuarios`
// (usuarios.id_personal -> usuarios.id_rol -> roles.nombre)
const BASE_SELECT = `
  SELECT
    personal.ID,
    personal.NOMBRE,
    personal.apellido,
    personal.DNI,
    personal.cargo,
    personal.id_rol,
    u.id AS usuario_id,
    u.usuario,
    u.id_rol AS usuario_id_rol,
    r.nombre AS rol_nombre,
    personal.ACTIVO,
    personal.OPERATIVO,
    personal.id_creado,
    personal.id_modificado
  FROM personal
  LEFT JOIN usuarios u ON u.id_personal = personal.ID
  LEFT JOIN roles r ON r.id = u.id_rol
`;

const mapPersonal = (row) => {
  if (!row) return null;
  return {
    // Legacy (consumidores existentes)
    ID: row.ID,
    NOMBRE: row.NOMBRE,
    DNI: row.DNI,
    ACTIVO: row.ACTIVO,
    OPERATIVO: row.OPERATIVO,
    id_creado: row.id_creado,
    id_modificado: row.id_modificado,
    // Alias usados por el módulo ABM de Personal
    id_personal: row.ID,
    nombre: row.NOMBRE,
    apellido: row.apellido ?? null,
    cargo: row.cargo ?? null,
    // Rol: prioridad cuenta de usuario, fallback columna legacy
    id_rol: row.usuario_id_rol ?? row.id_rol ?? null,
    rol_nombre: row.rol_nombre ?? null,
    tiene_usuario: row.usuario_id != null,
    usuario: row.usuario ?? null,
  };
};

const getAll = async () => {
  const [rows] = await db.query(`${BASE_SELECT} ORDER BY personal.ID`);
  return rows.map(mapPersonal);
};

const getById = async (id) => {
  const [rows] = await db.query(`${BASE_SELECT} WHERE personal.ID = ?`, [id]);
  return mapPersonal(rows[0]);
};

const insert = async (data) => {
  const { NOMBRE, apellido, DNI, cargo, id_rol, ACTIVO, OPERATIVO, id_creado } = data;
  const query = `
    INSERT INTO personal (NOMBRE, apellido, DNI, cargo, id_rol, ACTIVO, OPERATIVO, id_creado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(query, [
    NOMBRE,
    apellido || null,
    DNI,
    cargo || null,
    id_rol || null,
    ACTIVO !== undefined ? (ACTIVO ? 1 : 0) : 1,
    OPERATIVO !== undefined ? (OPERATIVO ? 1 : 0) : 1,
    id_creado || null
  ]);
  return result.insertId;
};

// Crea la cuenta de usuario del personal: usuario = DNI, contrasena = DNI (hasheada con bcrypt)
const insertUsuario = async ({ usuario, contrasena, idPersonal, idRol, idCreado }) => {
  const query = `
    INSERT INTO usuarios (usuario, contrasena, id_personal, id_rol, activo, id_creado)
    VALUES (?, ?, ?, ?, 1, ?)
  `;
  const [result] = await db.query(query, [usuario, contrasena, idPersonal, idRol || null, idCreado || null]);
  return result.insertId;
};

const existsDni = async (dni) => {
  const [rows] = await db.query('SELECT ID FROM personal WHERE DNI = ? LIMIT 1', [dni]);
  return rows.length > 0;
};

const findUsuarioByUsername = async (usuario) => {
  const [rows] = await db.query('SELECT id FROM usuarios WHERE usuario = ? LIMIT 1', [usuario]);
  return rows[0] || null;
};

const updateById = async (id, data) => {
  const fields = [];
  const params = [];

  if (data.NOMBRE !== undefined) { fields.push('NOMBRE = ?'); params.push(data.NOMBRE); }
  if (data.apellido !== undefined) { fields.push('apellido = ?'); params.push(data.apellido || null); }
  if (data.DNI !== undefined) { fields.push('DNI = ?'); params.push(data.DNI); }
  if (data.cargo !== undefined) { fields.push('cargo = ?'); params.push(data.cargo || null); }
  if (data.ACTIVO !== undefined) { fields.push('ACTIVO = ?'); params.push(data.ACTIVO ? 1 : 0); }
  if (data.OPERATIVO !== undefined) { fields.push('OPERATIVO = ?'); params.push(data.OPERATIVO ? 1 : 0); }
  if (data.id_rol !== undefined) { fields.push('id_rol = ?'); params.push(data.id_rol || null); }

  if (fields.length === 0) return 0;

  const query = `UPDATE personal SET ${fields.join(', ')} WHERE ID = ?`;
  params.push(id);

  const [result] = await db.query(query, params);
  return result.affectedRows;
};

// Busca la cuenta de usuario vinculada al personal
const findUsuarioByPersonal = async (idPersonal) => {
  const [rows] = await db.query('SELECT id, id_rol FROM usuarios WHERE id_personal = ?', [idPersonal]);
  return rows[0] || null;
};

// Sincroniza el rol en la cuenta de usuario vinculada
const updateUsuarioRol = async (idPersonal, idRol, idModificado) => {
  const query = 'UPDATE usuarios SET id_rol = ?, id_modificado = ? WHERE id_personal = ?';
  const [result] = await db.query(query, [idRol, idModificado || null, idPersonal]);
  return result.affectedRows;
};

// El nombre de usuario es igual al DNI: se sincroniza si cambia el DNI del personal
const updateUsuarioUsername = async (idPersonal, usuario, idModificado) => {
  const query = 'UPDATE usuarios SET usuario = ?, id_modificado = ? WHERE id_personal = ?';
  const [result] = await db.query(query, [usuario, idModificado || null, idPersonal]);
  return result.affectedRows;
};

const deleteById = async (id) => {
  const [result] = await db.query('DELETE FROM personal WHERE ID = ?', [id]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  getById,
  insert,
  insertUsuario,
  existsDni,
  findUsuarioByUsername,
  updateById,
  findUsuarioByPersonal,
  updateUsuarioRol,
  updateUsuarioUsername,
  deleteById,
};
