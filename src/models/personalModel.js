const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM personal');
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.execute('SELECT * FROM personal WHERE ID = ?', [id]);
  return rows[0];
};

const insert = async (data) => {
  const { NOMBRE, DNI, ACTIVO, OPERATIVO, id_creado } = data;
  const query = `
    INSERT INTO personal (NOMBRE, DNI, ACTIVO, OPERATIVO, id_creado)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(query, [
    NOMBRE, DNI,
    ACTIVO !== undefined ? (ACTIVO ? 1 : 0) : 1,
    OPERATIVO !== undefined ? (OPERATIVO ? 1 : 0) : 1,
    id_creado || null
  ]);
  return result.insertId;
};

const updateById = async (id, data) => {
  const { NOMBRE, DNI, ACTIVO, OPERATIVO, id_modificado } = data;
  const query = `
    UPDATE personal
    SET NOMBRE = ?, DNI = ?, ACTIVO = ?, OPERATIVO = ?, id_modificado = ?
    WHERE ID = ?
  `;
  const [result] = await db.execute(query, [
    NOMBRE, DNI,
    ACTIVO !== undefined ? (ACTIVO ? 1 : 0) : 1,
    OPERATIVO !== undefined ? (OPERATIVO ? 1 : 0) : 1,
    id_modificado || null,
    id
  ]);
  return result.affectedRows;
};

module.exports = { getAll, getById, insert, updateById };
