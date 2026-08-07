const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM otros_impuestos');
  return rows;
};

module.exports = {
  getAll,
};
