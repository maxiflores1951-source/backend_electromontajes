const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM items_checklist');
  return rows;
};

const getByCodigoSeccion = async (codigo_seccion) => {
  const [rows] = await db.execute('SELECT * FROM items_checklist WHERE codigo_seccion = ?', [codigo_seccion]);
  return rows;
};

module.exports = {
  getAll,
  getByCodigoSeccion,
};
