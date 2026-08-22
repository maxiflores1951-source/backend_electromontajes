const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query(`
    SELECT ev.*,
           epp.nombre AS nombre_epp,
           colores.nombre AS nombre_color,
           tallas.nombre AS nombre_talla,
           marcas.nombre AS nombre_marca,
           tipos_elementos.nombre AS nombre_tipo
    FROM epp_variantes ev
    LEFT JOIN epp ON ev.codigo_epp = epp.codigo
    LEFT JOIN colores ON ev.id_color = colores.id
    LEFT JOIN tallas ON ev.id_talla = tallas.id
    LEFT JOIN marcas ON ev.id_marca = marcas.id
    LEFT JOIN tipos_elementos ON ev.codigo_tipo = tipos_elementos.codigo
  `);
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM epp_variantes WHERE id = ?`,
    [id]
  );
  return rows[0];
};

const create = async (data) => {
  const {
    codigo_epp,
    id_color,
    id_talla,
    id_marca,
    codigo_tipo,
    cantidad,
  } = data;

  const query = `
    INSERT INTO epp_variantes (
      codigo_epp,
      id_color,
      id_talla,
      id_marca,
      codigo_tipo,
      cantidad
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    codigo_epp,
    id_color || null,
    id_talla || null,
    id_marca || null,
    codigo_tipo,
    cantidad || 0,
  ];

  const [result] = await db.query(query, values);
  return result.insertId;
};

const update = async (id, data) => {
  const {
    codigo_epp,
    id_color,
    id_talla,
    id_marca,
    codigo_tipo,
    cantidad,
  } = data;

  const query = `
    UPDATE epp_variantes
    SET codigo_epp = ?,
        id_color = ?,
        id_talla = ?,
        id_marca = ?,
        codigo_tipo = ?,
        cantidad = ?,
        FechaModificacion = NOW()
    WHERE id = ?
  `;

  const values = [
    codigo_epp,
    id_color || null,
    id_talla || null,
    id_marca || null,
    codigo_tipo,
    cantidad || 0,
    id,
  ];

  const [result] = await db.query(query, values);
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await db.query(
    'DELETE FROM epp_variantes WHERE id = ?',
    [id]
  );
  return result.affectedRows;
};

const getByCodigoYTipos = async (codigo_epp, id_color, id_talla, id_marca, codigo_tipo) => {
  const [rows] = await db.query(
    `SELECT * FROM epp_variantes WHERE codigo_epp = ? AND id_color = ? AND id_talla = ? AND id_marca = ? AND codigo_tipo = ?`,
    [codigo_epp, id_color, id_talla, id_marca, codigo_tipo]
  );
  return rows[0];
};

const sumarCantidad = async (id, cantidad) => {
  await db.query(
    'UPDATE epp_variantes SET cantidad = cantidad + ?, FechaModificacion = NOW() WHERE id = ?',
    [cantidad, id]
  );
  return;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getByCodigoYTipos,
  sumarCantidad,
};