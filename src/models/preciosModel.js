const db = require('../../db');

const insert = async (data) => {
  const query = 'INSERT INTO historial_precios (cod_articulo, cod_precio, precio, fecha) VALUES (?, ?, ?, ?)';
  const [result] = await db.execute(query, [data.cod_articulo, data.cod_precio, data.precio, data.fecha || new Date()]);
  return result.insertId;
};

const getUltimoPrecio = async (codArticulo, codPrecio = 'PC0') => {
  const query = 'SELECT precio FROM historial_precios WHERE cod_articulo = ? AND cod_precio = ? ORDER BY fecha DESC LIMIT 1';
  const [rows] = await db.execute(query, [codArticulo, codPrecio]);
  return rows[0]?.precio ?? null;
};

module.exports = {
  insert,
  getUltimoPrecio,
};
