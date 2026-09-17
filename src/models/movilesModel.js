const db = require('../../db');

const getAll = async () => {
  const query = `
    SELECT m.nro_ident, m.patente, m.id_responsable, m.kilometraje, m.tipo, t.descripcion AS tipo_descripcion, m.activo
    FROM moviles m
    LEFT JOIN tipo_unidad_movil t ON m.tipo = t.codigo
  `;
  const [rows] = await db.execute(query);
  return rows;
};

const getByNroIdent = async (nro_ident) => {
  const [rows] = await db.execute(
    `SELECT m.nro_ident, m.patente, m.id_responsable, m.kilometraje, m.tipo, t.descripcion AS tipo_descripcion, m.activo
     FROM moviles m
     LEFT JOIN tipo_unidad_movil t ON m.tipo = t.codigo
     WHERE m.nro_ident = ?`,
    [nro_ident]
  );
  return rows[0];
};

const insert = async (data) => {
  let nro_ident = data.nro_ident;
  if (!nro_ident) {
    const [[{ max }]] = await db.execute('SELECT MAX(CAST(REGEXP_REPLACE(nro_ident, "^UM", "") AS UNSIGNED)) AS max FROM moviles WHERE nro_ident LIKE "UM%"');
    const numero = (max || 0) + 1;
    nro_ident = `UM${numero.toString().padStart(2, '0')}`;
  }
  const [result] = await db.execute(
    'INSERT INTO moviles (nro_ident, patente, id_responsable, kilometraje, tipo, activo, id_creado) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nro_ident, data.patente ?? null, data.id_responsable ?? null, data.kilometraje ?? null, data.tipo ?? null, data.activo == null ? 1 : data.activo ? 1 : 0, data.id_creado ?? null]
  );
  return nro_ident;
};

const update = async (nro_ident, data) => {
  const [result] = await db.execute(
    'UPDATE moviles SET patente = ?, id_responsable = ?, kilometraje = ?, tipo = ?, activo = ?, id_modificado = ? WHERE nro_ident = ?',
    [data.patente ?? null, data.id_responsable ?? null, data.kilometraje ?? null, data.tipo ?? null, data.activo == null ? 1 : data.activo ? 1 : 0, data.id_modificado ?? null, nro_ident]
  );
  return result.affectedRows;
};

const remove = async (nro_ident) => {
  const [result] = await db.execute('DELETE FROM moviles WHERE nro_ident = ?', [nro_ident]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  getByNroIdent,
  insert,
  update,
  remove,
};
