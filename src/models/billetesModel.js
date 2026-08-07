const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM billetes_argentinos');
  return rows;
};

module.exports = {
  getAll,
};
