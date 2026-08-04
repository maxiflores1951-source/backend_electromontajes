const db = require('../../db');

const getLastId = async () => {
  const [result] = await db.query('SELECT MAX(id) AS ultimo FROM movimientosstock');
  return result[0].ultimo;
};

const insert = async (data) => {
  const { id, fecha_registro, tipo_operacion, responsable, id_lugar, observacion } = data;
  const query = `
    INSERT INTO movimientosstock
    (id, fecha_registro, tipo_operacion, responsable, id_lugar, observacion)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [
    id, fecha_registro, tipo_operacion, responsable, id_lugar || null, observacion
  ]);
  return result.affectedRows;
};

const insertArticulo = async (data) => {
  const { movimiento_id, articulo_id, stock } = data;
  const query = `
    INSERT INTO movimiento_articulos
    (movimiento_id, articulo_id, stock)
    VALUES (?, ?, ?)
  `;
  const [result] = await db.execute(query, [movimiento_id, articulo_id, stock]);
  return result.affectedRows;
};

const getAll = async () => {
  const query = `
    SELECT
      ms.id AS movimiento_id,
      ms.fecha_registro,
      ms.concepto,
      p.NOMBRE AS responsable,
      ms.tipo_operacion,
      ms.observacion,
      ma.articulo_id,
      ma.stock,
      a.Nombre_Art AS nombre_articulo,
      a.Unidad,
      fu.Descripcion AS descripcion_unidad,
      f.Nombre_Fam AS nombre_familia
    FROM movimientosstock ms
    JOIN movimiento_articulos ma ON ms.id = ma.movimiento_id
    JOIN personal p ON ms.responsable = p.ID
    JOIN articulo a ON ma.articulo_id = a.Cod_Articulo
    LEFT JOIN familia f ON a.Cod_Familia = f.Cod_Familia
    LEFT JOIN familiaunidad fu ON a.Unidad = fu.Cod_Unidad
    ORDER BY ms.fecha_registro DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

module.exports = { getLastId, insert, insertArticulo, getAll };
