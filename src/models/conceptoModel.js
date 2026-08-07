const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM concepto');
  return rows;
};

const getLastCodeByFamilia = async (familyCode) => {
  const query = `
    SELECT codigo FROM Concepto
    WHERE id_familia = ?
    ORDER BY codigo DESC LIMIT 1
  `;
  const [rows] = await db.query(query, [familyCode]);
  return rows[0];
};

module.exports = {
  getAll,
  getLastCodeByFamilia,
};
