const db = require('../../db');

const getAll = async () => {
  const query = `
    SELECT m.nro_ident, m.patente, m.id_responsable, m.kilometraje, m.tipo, t.descripcion AS tipo_descripcion, m.activo,
           m.id_propietario, p.nombre AS propietario_nombre,
           m.id_medida_bateria, mb.codigo_amperaje AS medida_bateria_nombre,
           m.tamano_rodado, m.tipo_combustible
    FROM moviles m
    LEFT JOIN tipo_unidad_movil t ON m.tipo = t.codigo
    LEFT JOIN propietarios p ON m.id_propietario = p.id
    LEFT JOIN medidas_baterias mb ON m.id_medida_bateria = mb.id
  `;
  const [rows] = await db.execute(query);
  return rows;
};

const getByNroIdent = async (nro_ident) => {
  const [rows] = await db.execute(
    `SELECT m.nro_ident, m.patente, m.id_responsable, m.kilometraje, m.tipo, t.descripcion AS tipo_descripcion, m.activo,
            m.id_propietario, p.nombre AS propietario_nombre,
            m.id_medida_bateria, mb.codigo_amperaje AS medida_bateria_nombre,
            m.tamano_rodado, m.tipo_combustible
     FROM moviles m
     LEFT JOIN tipo_unidad_movil t ON m.tipo = t.codigo
     LEFT JOIN propietarios p ON m.id_propietario = p.id
     LEFT JOIN medidas_baterias mb ON m.id_medida_bateria = mb.id
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
    'INSERT INTO moviles (nro_ident, patente, id_responsable, kilometraje, tipo, activo, id_creado, id_propietario, id_medida_bateria, tamano_rodado, tipo_combustible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nro_ident, data.patente ?? null, data.id_responsable ?? null, data.kilometraje ?? null, data.tipo ?? null, data.activo == null ? 1 : data.activo ? 1 : 0, data.id_creado ?? null, data.id_propietario ?? null, data.id_medida_bateria ?? null, data.tamano_rodado ?? null, data.tipo_combustible ?? null]
  );
  return nro_ident;
};

const update = async (nro_ident, data) => {
  const [result] = await db.execute(
    'UPDATE moviles SET nro_ident = ?, patente = ?, id_responsable = ?, kilometraje = ?, tipo = ?, activo = ?, id_modificado = ?, id_propietario = ?, id_medida_bateria = ?, tamano_rodado = ?, tipo_combustible = ? WHERE nro_ident = ?',
    [data.nro_ident ?? nro_ident, data.patente ?? null, data.id_responsable ?? null, data.kilometraje ?? null, data.tipo ?? null, data.activo == null ? 1 : data.activo ? 1 : 0, data.id_modificado ?? null, data.id_propietario ?? null, data.id_medida_bateria ?? null, data.tamano_rodado ?? null, data.tipo_combustible ?? null, nro_ident]
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
