const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM tipos_elementos');
  return rows;
};

module.exports = {
  getAll,
};
