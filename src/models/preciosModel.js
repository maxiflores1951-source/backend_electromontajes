const db = require('../../db');

const insert = async (data) => {
  const query = 'INSERT INTO historial_precios (cod_articulo, cod_precio, precio, fecha) VALUES (?, ?, ?, ?)';
  const [result] = await db.execute(query, [data.cod_articulo, data.cod_precio, data.precio, data.fecha || new Date()]);
  return result.insertId;
};

module.exports = {
  insert,
};
