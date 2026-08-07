const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM plandecompra');
  return rows;
};

module.exports = {
  getAll,
};
