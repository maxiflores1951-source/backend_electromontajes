const db = require('../../db');

const getLastCodigo = async () => {
  const [rows] = await db.query('SELECT MAX(codigo) AS ultimo FROM movimientostockepp');
  return rows[0].ultimo;
};

const codigoExists = async (codigo) => {
  const [rows] = await db.query('SELECT COUNT(*) AS count FROM movimientostockepp WHERE codigo = ?', [codigo]);
  return rows[0].count > 0;
};

const insert = async (data) => {
  const { codigo, fecha_registro, tipo_operacion, responsable_id, observacion } = data;
  const [result] = await db.query(
    'INSERT INTO movimientostockepp (codigo, fecha_registro, tipo_operacion, responsable_id, observacion) VALUES (?, ?, ?, ?, ?)',
    [codigo, fecha_registro, tipo_operacion, responsable_id, observacion]
  );
  return result.insertId;
};

const insertDetalle = async (data) => {
  const { codigo, codigoepp, stock } = data;
  await db.query(
    'INSERT INTO movimiento_epp (codigo, codigoepp, stock) VALUES (?, ?, ?)',
    [codigo, codigoepp, stock]
  );
};

const getMovimientos = async () => {
  const [rows] = await db.query(`
    SELECT m.*, p.NOMBRE AS nombre_responsable
    FROM movimientostockepp m
    JOIN personal p ON m.responsable_id = p.ID
  `);
  return rows;
};

const getDetallesMovimiento = async (codigo) => {
  const [rows] = await db.query(`
    SELECT me.*, e.nombre AS nombre_epp, e.cantidad, e.unidad
    FROM movimiento_epp me
    JOIN epp e ON me.codigoepp = e.codigo
    WHERE me.codigo = ?
  `, [codigo]);
  return rows;
};

module.exports = {
  getLastCodigo,
  codigoExists,
  insert,
  insertDetalle,
  getMovimientos,
  getDetallesMovimiento,
};
