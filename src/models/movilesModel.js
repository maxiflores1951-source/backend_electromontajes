const db = require('../../db');

const getAll = async () => {
  const query = `
    SELECT m.nro_ident, m.patente, m.id_responsable, m.kilometraje, m.tipo, t.descripcion AS tipo_descripcion
    FROM moviles m
    LEFT JOIN tipo_unidad_movil t ON m.tipo = t.codigo
  `;
  const [rows] = await db.execute(query);
  return rows;
};

module.exports = {
  getAll,
};
