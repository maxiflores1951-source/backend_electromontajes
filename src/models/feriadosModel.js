const db = require('../../db');

const getAll = async (year, anios) => {
  let query = 'SELECT * FROM feriados';
  let params = [];

  if (year) {
    query += ' WHERE año = ?';
    params.push(year);
  } else if (anios) {
    const yearsArray = anios.split(',').map(y => parseInt(y.trim()));
    query += ' WHERE año IN (?)';
    params.push(yearsArray);
  }

  query += ' ORDER BY fecha ASC';

  const [rows] = await db.execute(query, params);
  return rows;
};

const bulkUpsert = async (feriados) => {
  const values = feriados.map(feriado => [
    feriado.fecha,
    feriado.nombre,
    feriado.tipo,
    feriado.año,
  ]);

  const query = `
    INSERT INTO feriados (fecha, nombre, tipo, año)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      nombre = VALUES(nombre),
      tipo = VALUES(tipo)
  `;

  const [result] = await db.execute(query, [values]);
  return result.affectedRows;
};

const deleteByYear = async (year) => {
  const [result] = await db.execute('DELETE FROM feriados WHERE año = ?', [year]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  bulkUpsert,
  deleteByYear,
};
