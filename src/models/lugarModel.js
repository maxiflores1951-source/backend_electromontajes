const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM lugares');
  return rows;
};

module.exports = { getAll };
