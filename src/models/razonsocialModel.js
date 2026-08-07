const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM razones_sociales');
  return rows;
};

module.exports = {
  getAll,
};
