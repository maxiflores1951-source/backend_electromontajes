const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM viaticos');
  return rows;
};

module.exports = {
  getAll,
};
