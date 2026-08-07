const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM motivos');
  return rows;
};

module.exports = {
  getAll,
};
