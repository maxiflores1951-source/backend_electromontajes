const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM cotizacion');
  return rows;
};

const insert = async (data) => {
  const { nombre_cot, unidad_cot } = data;
  const query = 'INSERT INTO cotizacion (nombre_cot, unidad_cot) VALUES (?, ?)';
  const values = [nombre_cot, unidad_cot];
  const [result] = await db.query(query, values);
  return result;
};

const deleteById = async (id) => {
  await db.query('DELETE FROM cotizacion WHERE id = ?', [id]);
};

const getArticulos = async (codigo_cotizacion, codigo_detalle) => {
  const query = `
    SELECT 
      a.Cod_Articulo AS codigo, 
      a.Nombre_Art AS descripcion, 
      a.Cod_Familia AS familia,
      a.Precio_Lista0 AS precioUnitario0,
      a.Precio_Lista1 AS precioUnitario1,
      a.Precio_Lista2 AS precioUnitario2,
      a.Unidad AS unidad, 
      d.cantidad AS cantidad, 
      a.Cod_proveedor AS proveedor,
      a.Descuento AS descuento,
      a.Cantidad AS stock,
      (d.cantidad * a.Precio_Lista0) AS total
    FROM 
      detalle_c AS d
    INNER JOIN 
      articulo AS a 
      ON d.Cod_Articulo = a.Cod_Articulo
    WHERE 
      d.codigo_cotizacion = ? AND d.codigo_detalle = ?
  `;
  const [rows] = await db.query(query, [codigo_cotizacion, codigo_detalle]);
  return rows;
};

const getMateriales = async () => {
  const query = `
    SELECT
      c.codigo_cotizacion,
      c.nombre_cotizacion,
      d.Cod_Articulo AS cod_articulo,
      a.Nombre_Art AS nombre_articulo,
      a.UNIDAD AS unidad,
      d.cantidad
    FROM cotizacion c
    JOIN detalle_c d ON c.codigo_cotizacion = d.codigo_cotizacion
    JOIN articulo a ON d.Cod_Articulo = a.Cod_Articulo
    ORDER BY c.codigo_cotizacion;
  `;
  const [rows] = await db.query(query);
  return rows;
};

module.exports = {
  getAll,
  insert,
  deleteById,
  getArticulos,
  getMateriales,
};
