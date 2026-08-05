const db = require('../../db');

const getLastId = async () => {
  const [result] = await db.query('SELECT MAX(id) AS ultimo FROM movimientosstockherramientas');
  return result[0].ultimo;
};

const insertMovimiento = async (conn, data) => {
  const { id, fecha_registro, responsable, tipo_operacion, observacion } = data;
  const query = `
    INSERT INTO movimientosstockherramientas
    (id, fecha_registro, responsable, tipo_operacion, observacion)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await conn.execute(query, [
    id, fecha_registro, responsable, tipo_operacion, observacion
  ]);
  return result.affectedRows;
};

const getUltimoEntrega = async (conn, codigoHerramienta) => {
  const query = `
    SELECT movimiento_id FROM movimiento_herramientas
    WHERE codigoHerramienta = ? AND actual = 1
    ORDER BY id DESC LIMIT 1
  `;
  const [rows] = await conn.execute(query, [codigoHerramienta]);
  return rows;
};

const actualizarEntregaAnterior = async (conn, codigoMovimiento, movimientoId, codigoHerramienta) => {
  const query = `
    UPDATE movimiento_herramientas
    SET actual = 0, relacion = ?
    WHERE movimiento_id = ? AND codigoHerramienta = ?
  `;
  const [result] = await conn.execute(query, [
    codigoMovimiento, movimientoId, codigoHerramienta
  ]);
  return result.affectedRows;
};

const insertMovimientoHerramienta = async (conn, data) => {
  const { movimiento_id, codigoHerramienta, actual, relacion } = data;
  const query = `
    INSERT INTO movimiento_herramientas
    (movimiento_id, codigoHerramienta, actual, relacion)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await conn.execute(query, [
    movimiento_id, codigoHerramienta, actual, relacion
  ]);
  return result.affectedRows;
};

const getAll = async () => {
  const query = `
    SELECT
      msh.id AS movimiento_id,
      msh.fecha_registro,
      p.NOMBRE AS responsable,
      msh.tipo_operacion,
      msh.observacion,
      mh.id AS id_movimiento_herramienta,
      mh.movimiento_id AS id_movimiento,
      mh.codigoHerramienta,
      h.nombre AS nombreHerramienta,
      mh.actual,
      mh.relacion,
      fh.Nom_Familia AS nombreFamilia
    FROM movimientosstockherramientas msh
    JOIN movimiento_herramientas mh ON msh.id = mh.movimiento_id
    JOIN herramienta h ON mh.codigoHerramienta = h.codigoHerramienta
    JOIN personal p ON msh.responsable = p.ID
    LEFT JOIN familiaherramienta fh ON h.CodigoFamilia = fh.Cod_Familia
    ORDER BY msh.fecha_registro DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

module.exports = {
  getLastId,
  insertMovimiento,
  getUltimoEntrega,
  actualizarEntregaAnterior,
  insertMovimientoHerramienta,
  getAll,
};
