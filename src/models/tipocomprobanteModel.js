const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM tipocomprobante');
  return rows;
};

const getCompra = async () => {
  const [rows] = await db.execute('SELECT * FROM tipocomprobante WHERE compra = 1');
  return rows;
};

module.exports = {
  getAll,
  getCompra,
};
