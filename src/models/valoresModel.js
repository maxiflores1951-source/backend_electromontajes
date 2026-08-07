const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM valores');
  return rows;
};

const getExceptoCodigo1 = async () => {
  const [rows] = await db.execute('SELECT * FROM valores WHERE codigo <> 1');
  return rows;
};

module.exports = {
  getAll,
  getExceptoCodigo1,
};
