const db = require('../../db');

const getAll = async () => {
  const query = `
    SELECT 
      c.CODCLI,
      c.DENOMINACION,
      c.DIRECCION,
      c.CUIT,
      c.EMAIL AS email_cliente,
      c.TELEFONO AS telefono_cliente,
      c.IDSITFISCAL,
      sf.Descripcion AS situacion_fiscal,

      cc.id_contacto,
      cc.nombre AS nombre_contacto,
      cc.puesto AS puesto_contacto,
      cc.telefono AS telefono_contacto,
      cc.email AS email_contacto

    FROM clientes c
    LEFT JOIN sitfiscal sf ON c.IDSITFISCAL = sf.IDSITFISCAL
    LEFT JOIN contacto_clientes cc ON c.CODCLI = cc.id_cliente
  `;
  const [rows] = await db.query(query);
  return rows;
};

const insert = async (data) => {
  const { DENOMINACION, DIRECCION, IDSITFISCAL, CUIT, EMAIL, TELEFONO } = data;
  const query = `
    INSERT INTO clientes (DENOMINACION, DIRECCION, IDSITFISCAL, CUIT, EMAIL, TELEFONO)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(query, [DENOMINACION, DIRECCION, IDSITFISCAL, CUIT, EMAIL, TELEFONO]);
  return result.insertId;
};

const getClienteById = async (connection, id) => {
  const query = `
    SELECT 
      c.CODCLI AS id,
      c.DENOMINACION AS name,
      c.CUIT AS rut
    FROM clientes c
    WHERE c.CODCLI = ?
  `;
  const [rows] = await connection.query(query, [id]);
  return rows;
};

const getServiciosCliente = async (connection, id) => {
  const query = `
    SELECT DISTINCT
      s.IDOBRA AS id_servicio,
      s.OBRA AS name
    FROM presupuesto p
    JOIN servicios s ON p.id_servicio = s.IDOBRA
    WHERE p.id_cliente = ?
    ORDER BY s.OBRA ASC
  `;
  const [rows] = await connection.query(query, [id]);
  return rows;
};

const getPresupuestosCliente = async (connection, idCliente, idServicio) => {
  const query = `
    SELECT 
      p.codigo,
      p.codigo AS numero,
      DATE_FORMAT(p.fecha, '%d/%m/%Y') AS fecha,
      p.saldo_iva AS saldoIva,
      p.saldo_sin_iva AS saldoSinIva
    FROM presupuesto p
    WHERE p.id_cliente = ? 
      AND p.id_servicio = ?
    ORDER BY p.fecha DESC
  `;
  const [rows] = await connection.query(query, [idCliente, idServicio]);
  return rows;
};

const getFacturasPresupuesto = async (connection, codigoPresupuesto) => {
  const query = `
    SELECT DISTINCT
      fv.codigo,
      fv.NroCmp AS numero,
      DATE_FORMAT(fv.fecha, '%d/%m/%Y') AS fecha,
      fv.importe AS monto,
      fv.tipoCmp,
      fv.codigoletra,
      fv.ptoVta,
      fv.estado
    FROM factura_venta fv
    JOIN detalle_factura_venta dfv ON fv.codigo = dfv.codigo_factura_venta
    WHERE dfv.codigo_presupuesto = ?
    ORDER BY fv.fecha ASC
  `;
  const [rows] = await connection.query(query, [codigoPresupuesto]);
  return rows;
};

const getFormasPagoFactura = async (connection, codigoFactura) => {
  const query = `
    SELECT 
      fp.codigo_valor,
      v.descripcion AS descripcion_valor,
      DATE_FORMAT(fp.fecha, '%d/%m/%Y') AS fecha,
      fp.importe AS monto
    FROM formas_pago_factura_venta fp
    JOIN valores v ON v.codigo = fp.codigo_valor
    WHERE fp.codigo_factura_venta = ?
    ORDER BY fp.fecha ASC
  `;
  const [rows] = await connection.query(query, [codigoFactura]);
  return rows;
};

const getRecibosFactura = async (connection, codigoFactura) => {
  const query = `
    SELECT 
      r.NroCmp AS numero,
      DATE_FORMAT(r.fecha, '%d/%m/%Y') AS fecha,
      dr.pago AS monto
    FROM detalle_recibo dr
    JOIN recibo r ON r.codigo = dr.codigo_recibo
    WHERE dr.codigo_factura_venta = ?
    ORDER BY r.fecha ASC
  `;
  const [rows] = await connection.query(query, [codigoFactura]);
  return rows;
};

const getById = async (id) => {
  const query = `
    SELECT 
      c.CODCLI,
      c.DENOMINACION,
      c.DIRECCION,
      c.CUIT,
      c.EMAIL AS email_cliente,
      c.TELEFONO AS telefono_cliente,
      c.IDSITFISCAL,
      sf.Descripcion AS situacion_fiscal
    FROM clientes c
    LEFT JOIN sitfiscal sf ON c.IDSITFISCAL = sf.IDSITFISCAL
    WHERE c.CODCLI = ?
  `;
  const [rows] = await db.query(query, [id]);
  return rows;
};

const getEstadosObra = async () => {
  const [rows] = await db.execute(`
    SELECT 
      codigo_estado,
      nombre_estado
    FROM 
      estados_obra
    ORDER BY 
      codigo_estado ASC
  `);
  return rows;
};

module.exports = {
  getAll,
  insert,
  getClienteById,
  getServiciosCliente,
  getPresupuestosCliente,
  getFacturasPresupuesto,
  getFormasPagoFactura,
  getRecibosFactura,
  getById,
  getEstadosObra,
};
