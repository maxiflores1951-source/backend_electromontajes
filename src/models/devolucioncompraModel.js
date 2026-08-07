const db = require('../../db');

const getConnection = async () => await db.getConnection();
const beginTransaction = async (connection) => await connection.beginTransaction();
const commit = async (connection) => await connection.commit();
const rollback = async (connection) => await connection.rollback();
const release = async (connection) => await connection.release();

const getLastCodigo = async (connection) => {
  const [result] = await connection.query('SELECT MAX(codigo) AS ultimo FROM devolucion_compra');
  return result.length > 0 ? result[0].ultimo : null;
};

const checkCodigoExists = async (connection, codigo) => {
  const [rows] = await connection.query(
    'SELECT COUNT(*) AS count FROM devolucion_compra WHERE codigo = ?',
    [codigo]
  );
  return rows[0].count > 0;
};

const insertDevolucion = async (connection, params) => {
  const {
    codigoDevolucion, fecha_pedido, id_solicitado, id_proveedor,
    id_motivo, id_servicio, id_movil, observacion
  } = params;

  const query = `
    INSERT INTO devolucion_compra (
      codigo, fecha_devolucion, id_solicitado, id_proveedor, id_motivo,
      id_servicio, id_movil, activo, id_razon_social, observacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`;

  await connection.query(query, [
    codigoDevolucion,
    fecha_pedido,
    id_solicitado,
    id_proveedor,
    id_motivo,
    id_servicio || null,
    id_movil || null,
    1,
    observacion || null
  ]);
};

const insertMovimiento = async (connection, params) => {
  const { codigoDevolucion, articulo } = params;

  const query = `
    INSERT INTO movimientos_devolucion_compras (
      codigo_devolucion_compra, tipo_movimiento, id_articulo, unidad,
      nombre, cantidad, activo, codigo_nota_credito_compra
    ) VALUES (?, 'articulo', ?, 'UN', ?, ?, 1, ?)`;

  await connection.query(query, [
    codigoDevolucion,
    articulo.id_articulo,
    articulo.nombre,
    articulo.cantidad,
    articulo.codigo_documento || null
  ]);
};

const getDevolucionesCompra = async () => {
  const [rows] = await db.query(`
    SELECT dc.*,
           p.Nombre_Prov AS nombre_proveedor,
           m.nombre AS nombre_motivo,
           ps.NOMBRE AS nombre_solicitado,
           rs.razon_social,
           rs.cuil,
           s.OBRA AS nombre_obra
    FROM devolucion_compra dc
    JOIN proveedor p ON dc.id_proveedor = p.Cod_Proveedor
    LEFT JOIN motivos m ON dc.id_motivo = m.codigo
    LEFT JOIN personal ps ON dc.id_solicitado = ps.ID
    LEFT JOIN razones_sociales rs ON dc.id_razon_social = rs.id
    LEFT JOIN servicios s ON dc.id_servicio = s.IDOBRA
    ORDER BY dc.codigo DESC;
  `);
  return rows;
};

const getMovimientosDevolucion = async (codigo) => {
  const [rows] = await db.query(`
    SELECT
      mdc.*,
      ncc.codigo as nota_credito_codigo
    FROM movimientos_devolucion_compras mdc
    LEFT JOIN nota_credito_compra ncc ON mdc.codigo_nota_credito_compra = ncc.codigo
    WHERE mdc.codigo_devolucion_compra = ?
  `, [codigo]);
  return rows;
};

module.exports = {
  getConnection,
  beginTransaction,
  commit,
  rollback,
  release,
  getLastCodigo,
  checkCodigoExists,
  insertDevolucion,
  insertMovimiento,
  getDevolucionesCompra,
  getMovimientosDevolucion,
};
