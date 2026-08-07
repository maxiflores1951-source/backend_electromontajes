const db = require('../../db');

const getLastCodigo = async (connection) => {
  const [result] = await connection.query('SELECT MAX(codigo) AS ultimo FROM caja');
  return result.length > 0 ? result[0].ultimo : null;
};

const cajaExists = async (connection, codigo) => {
  const [rows] = await connection.query('SELECT codigo FROM caja WHERE codigo = ?', [codigo]);
  return rows;
};

const insertCaja = async (connection, values) => {
  const query = `
    INSERT INTO caja (
      codigo, fecha_pedido, id_solicitado, id_motivo,
      id_servicio, id_movil, operacion, observacion, importe,
      estado, plazo_rendicion
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await connection.query(query, values);
};

const insertMovimientos = async (connection, data) => {
  const query = `
    INSERT INTO movimientos_caja (detalle, importe, codigo_caja) VALUES ?
  `;
  await connection.query(query, [data]);
};

const insertFormasPago = async (connection, data) => {
  const query = `
    INSERT INTO formas_pago_caja (codigo_caja, codigo, descripcion, fecha, importe) VALUES ?
  `;
  await connection.query(query, [data]);
};

const getCajas = async () => {
  const query = `
    SELECT 
      c.*, 
      p.NOMBRE AS nombre_solicitante,
      m.nombre AS nombre_motivo,
      s.OBRA AS nombre_obra
    FROM caja c
    LEFT JOIN personal p ON c.id_solicitado = p.ID
    LEFT JOIN motivos m ON c.id_motivo = m.codigo
    LEFT JOIN servicios s ON c.id_servicio = s.IDOBRA
    ORDER BY c.codigo DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getMovimientos = async (codigoCaja) => {
  const query = `
    SELECT detalle, importe FROM movimientos_caja WHERE codigo_caja = ?
  `;
  const [rows] = await db.query(query, [codigoCaja]);
  return rows;
};

const getFormasDePago = async (codigoCaja) => {
  const query = `
    SELECT codigo, descripcion, fecha, importe 
    FROM formas_pago_caja 
    WHERE codigo_caja = ?
  `;
  const [rows] = await db.query(query, [codigoCaja]);
  return rows;
};

const getFacturasByCaja = async (codigoCaja) => {
  const query = `
    SELECT fc.*
    FROM caja_factura_compra cfc
    INNER JOIN factura_compra fc ON cfc.codigo_factura = fc.codigo
    WHERE cfc.codigo_caja = ?
  `;
  const [rows] = await db.query(query, [codigoCaja]);
  return rows;
};

const getCajaFacturaRegistros = async () => {
  const query = `
    SELECT 
      cfc.id,
      cfc.codigo_caja,
      fc.codigo AS codigo_factura,
      fc.fecha AS fecha_factura,
      fc.importe AS importe_factura,
      c.fecha_pedido AS fecha_caja,
      c.operacion AS operacion_caja
    FROM caja_factura_compra cfc
    LEFT JOIN caja c ON cfc.codigo_caja = c.codigo
    LEFT JOIN factura_compra fc ON cfc.codigo_factura = fc.codigo
    ORDER BY cfc.id DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getCajaByCodigo = async (codigoCaja) => {
  const [rows] = await db.query('SELECT codigo FROM caja WHERE codigo = ?', [codigoCaja]);
  return rows;
};

const getFacturaByCodigo = async (codigoFactura) => {
  const [rows] = await db.query('SELECT codigo FROM factura_compra WHERE codigo = ?', [codigoFactura]);
  return rows;
};

const insertCajaFactura = async (values) => {
  const query = `
    INSERT INTO caja_factura_compra (codigo_caja, codigo_factura, fecha_aplicacion) 
    VALUES (?, ?, ?)
  `;
  await db.query(query, values);
};

const getCajaFacturaByCodigoCaja = async (codigoCaja) => {
  const query = `
    SELECT 
      cfc.id,
      cfc.codigo_caja,
      c.fecha_pedido AS fecha_caja,
      c.operacion AS operacion_caja,
      fc.*,
      p.Razon_Social AS nombre_proveedor,
      tc.descripcion AS nombre_tipocomprobante
    FROM caja_factura_compra cfc
    LEFT JOIN caja c 
      ON cfc.codigo_caja = c.codigo
    LEFT JOIN factura_compra fc 
      ON cfc.codigo_factura = fc.codigo
    LEFT JOIN proveedor p 
      ON fc.id_proveedor = p.Cod_Proveedor
    LEFT JOIN tipocomprobante tc 
      ON fc.tipoCmp = tc.codigo
    WHERE cfc.codigo_caja = ?
    ORDER BY cfc.id DESC
  `;
  const [rows] = await db.query(query, [codigoCaja]);
  return rows;
};

const getCajaFacturaRelacion = async (codigoCaja, codigoFactura) => {
  const query = 'SELECT * FROM caja_factura_compra WHERE codigo_caja = ? AND codigo_factura = ?';
  const [rows] = await db.query(query, [codigoCaja, codigoFactura]);
  return rows;
};

const deleteCajaFactura = async (codigoCaja, codigoFactura) => {
  const query = 'DELETE FROM caja_factura_compra WHERE codigo_caja = ? AND codigo_factura = ?';
  await db.query(query, [codigoCaja, codigoFactura]);
};

const rendirCaja = async (values) => {
  const query = 'UPDATE caja SET saldo = ?, estado = ? WHERE codigo = ?';
  await db.query(query, values);
};

const getCajaForUpdate = async (codigoCaja) => {
  const [rows] = await db.query('SELECT saldo, importe, estado FROM caja WHERE codigo = ?', [codigoCaja]);
  return rows;
};

const updateCaja = async (values) => {
  const query = `
    UPDATE caja SET
      fecha_pedido = ?,
      id_solicitado = ?,
      id_motivo = ?,
      id_servicio = ?,
      id_movil = ?,
      operacion = ?,
      observacion = ?,
      importe = ?,
      saldo = ?,
      estado = ?,
      plazo_rendicion = ?
    WHERE codigo = ?
  `;
  await db.query(query, values);
};

const deleteMovimientos = async (codigoCaja) => {
  await db.query('DELETE FROM movimientos_caja WHERE codigo_caja = ?', [codigoCaja]);
};

const deleteFormasPagoCaja = async (codigoCaja) => {
  await db.query('DELETE FROM formas_pago_caja WHERE codigo_caja = ?', [codigoCaja]);
};

module.exports = {
  getLastCodigo,
  cajaExists,
  insertCaja,
  insertMovimientos,
  insertFormasPago,
  getCajas,
  getMovimientos,
  getFormasDePago,
  getFacturasByCaja,
  getCajaFacturaRegistros,
  getCajaByCodigo,
  getFacturaByCodigo,
  insertCajaFactura,
  getCajaFacturaByCodigoCaja,
  getCajaFacturaRelacion,
  deleteCajaFactura,
  rendirCaja,
  getCajaForUpdate,
  updateCaja,
  deleteMovimientos,
  deleteFormasPagoCaja,
};
