const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM familia');
  return rows;
};

module.exports = { getAll };
