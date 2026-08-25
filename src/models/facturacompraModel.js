const db = require('../../db');

const getConnection = async () => await db.getConnection();
const beginTransaction = async (connection) => await connection.beginTransaction();
const commit = async (connection) => await connection.commit();
const rollback = async (connection) => await connection.rollback();
const release = async (connection) => await connection.release();

const getLastCodigo = async (connection) => {
  const [result] = await connection.query('SELECT MAX(codigo) AS ultimo FROM factura_compra');
  return result.length > 0 ? result[0].ultimo : null;
};

const insertFactura = async (connection, params) => {
  const {
    codigoFactura, fecha, tipoCmp, codigoletra, ptoVta, NroCmp, moneda, ctz,
    id_proveedor, id_plancompra, id_motivo, id_servicio, id_movil,
    id_responsable, id_razonsocial, totalIVA21, totalIVA27, totalIVA10,
    bonificacion, periodoiva, importe, observacion, estado, saldoFinal
  } = params;

  const query = `
    INSERT INTO factura_compra (
      codigo, fecha, tipoCmp, codigoletra, ptoVta, NroCmp, moneda, ctz,
      id_proveedor, id_plancompra, id_motivo, id_servicio, id_movil,
      id_responsable, id_razonsocial, totalIVA21, totalIVA27, totalIVA10,
      bonificacion, periodoiva, importe, observacion, anulada, Estado, saldo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`;

  const values = [
    codigoFactura, fecha, tipoCmp, codigoletra, ptoVta, NroCmp, moneda, ctz || 1,
    id_proveedor, id_plancompra, id_motivo, id_servicio || null, id_movil || null,
    id_responsable || null, id_razonsocial,
    totalIVA21 || 0, totalIVA27 || 0, totalIVA10 || 0,
    bonificacion || 0,
    null,
    importe,
    observacion || null,
    estado || 'Completa',
    saldoFinal
  ];

  await connection.query(query, values);
};

const insertMovimientos = async (connection, movimientosData) => {
  const query = `
    INSERT INTO movimientos_factura_compras (
      codigo_factura_compra, tipo_movimiento,
      id_articulo, id_concepto, id_herramienta, id_epp,
      unidad, nombre, cantidad, precio, descuento, precio_final,
      importe, codigo_orden, iva_compras, codigo_remito,
      activo, cantidad_remitos, saldo
    ) VALUES ?`;
  await connection.query(query, [movimientosData]);
};

const findEppVariant = async (connection, params) => {
  const { codigoEpp, colorId, tallaId, marcaId, codigo_tipo } = params;
  const query = `
    SELECT id, cantidad FROM epp_variantes 
    WHERE codigo_epp = ? 
    AND (? IS NULL AND id_color IS NULL OR id_color = ?)
    AND (? IS NULL AND id_talla IS NULL OR id_talla = ?)
    AND (? IS NULL AND id_marca IS NULL OR id_marca = ?)
    AND codigo_tipo = ?`;
  const [rows] = await connection.query(query, [
    codigoEpp,
    colorId, colorId,
    tallaId, tallaId,
    marcaId, marcaId,
    codigo_tipo
  ]);
  return rows;
};

const updateEppVariant = async (connection, params) => {
  const { nuevaCantidad, id_creacion, variantId } = params;
  const query = `
    UPDATE epp_variantes 
    SET cantidad = ?, 
        FechaModificacion = NOW(),
        id_modificacion = ?
    WHERE id = ?`;
  await connection.query(query, [nuevaCantidad, id_creacion || null, variantId]);
};

const insertEppVariant = async (connection, params) => {
  const { codigoEpp, colorId, tallaId, marcaId, codigo_tipo, cantidadNum, id_creacion } = params;
  const query = `
    INSERT INTO epp_variantes (
      codigo_epp, id_color, id_talla, id_marca, codigo_tipo, 
      cantidad, id_creacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  await connection.query(query, [
    codigoEpp,
    colorId,
    tallaId,
    marcaId,
    codigo_tipo,
    cantidadNum,
    id_creacion || null
  ]);
};

const insertOtrosImpuestos = async (connection, impuestosData) => {
  const query = `
    INSERT INTO otros_impuestos_factura_compra (
      codigo_factura_compra, codigo_impuesto, valor
    ) VALUES ?`;
  await connection.query(query, [impuestosData]);
};

const insertFormasPago = async (connection, formasPagoData) => {
  const query = `
    INSERT INTO formas_pago_factura_compra (
      codigo_factura_compra, codigo_valor, fecha, importe
    ) VALUES ?`;
  await connection.query(query, [formasPagoData]);
};

const insertRemitoOrden = async (connection, codigo, codigoFactura) => {
  const query = `
    INSERT INTO remito_orden (orden_compra, factura)
    SELECT ?, ? WHERE NOT EXISTS (
      SELECT 1 FROM remito_orden WHERE orden_compra = ? AND factura = ?
    )`;
  await connection.query(query, [codigo, codigoFactura, codigo, codigoFactura]);
};

const insertRemitoFactura = async (connection, codigoFactura, codigo) => {
  const query = `
    INSERT INTO remito_factura (factura, remito)
    SELECT ?, ? WHERE NOT EXISTS (
      SELECT 1 FROM remito_factura WHERE factura = ? AND remito = ?
    )`;
  await connection.query(query, [codigoFactura, codigo, codigoFactura, codigo]);
};

const getFacturas = async () => {
  const query = `
    SELECT fc.*,
           DATE_FORMAT(fc.fecha, '%d/%m/%Y') AS fecha,
           p.Nombre_Prov AS nombre_proveedor,
           p.Razon_Social AS razon_social_proveedor,
           p.Cuilt AS cuit_proveedor,
           m.nombre AS nombre_motivo,
           pl.descripcion AS nombre_plan,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           tc.descripcion AS tipo_comprobante,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_obra,
           mv.patente AS patente_movil,
           mv.kilometraje AS kilometraje_movil
    FROM factura_compra fc
    JOIN proveedor p ON fc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON fc.id_motivo = m.codigo
    JOIN plandecompra pl ON fc.id_plancompra = pl.codigo
    JOIN razones_sociales rs ON fc.id_razonsocial = rs.id
    JOIN tipocomprobante tc ON fc.tipoCmp = tc.codigo
    JOIN moneda mon ON fc.moneda = mon.codigo
    LEFT JOIN servicios s ON fc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON fc.id_movil = mv.nro_ident
    WHERE fc.anulada = 0
    ORDER BY fc.codigo DESC;`;
  const [rows] = await db.query(query);
  return rows;
};

const getMovimientosFactura = async (codigo) => {
  const [rows] = await db.query(
    'SELECT * FROM movimientos_factura_compras WHERE codigo_factura_compra = ?',
    [codigo]
  );
  return rows;
};

const getOtrosImpuestosFactura = async (codigo) => {
  const [rows] = await db.query(`
    SELECT oi.*, imp.nombre AS nombre_impuesto
    FROM otros_impuestos_factura_compra oi
    JOIN otros_impuestos imp ON oi.codigo_impuesto = imp.codigo
    WHERE oi.codigo_factura_compra = ?
  `, [codigo]);
  return rows;
};

const getFormasPagoFactura = async (codigo) => {
  const [rows] = await db.query(`
    SELECT fp.*, DATE_FORMAT(fp.fecha, '%d/%m/%Y') AS fecha, v.descripcion AS descripcion_valor
    FROM formas_pago_factura_compra fp
    JOIN valores v ON fp.codigo_valor = v.codigo
    WHERE fp.codigo_factura_compra = ?
  `, [codigo]);
  return rows;
};

const getFacturaByCodigo = async (codigo) => {
  const [rows] = await db.query('SELECT *, DATE_FORMAT(fecha, \'%d/%m/%Y\') AS fecha FROM factura_compra WHERE codigo = ?', [codigo]);
  return rows;
};

const anularFactura = async (codigo) => {
  const [result] = await db.query('UPDATE factura_compra SET anulada = 1 WHERE codigo = ?', [codigo]);
  return result.affectedRows;
};

const filtrarFacturas = async (desdeCompleto, hastaCompleto) => {
  const [rows] = await db.query(`
    SELECT fc.*,
      DATE_FORMAT(fc.fecha, '%d/%m/%Y') AS fecha,
      p.Nombre_Prov AS nombre_proveedor,
      p.Cuilt AS cuil_proveedor,
      p.IDSITFISCAL AS id_fiscal_proveedor,
      p.Razon_Social AS razon_social_proveedor,
      m.nombre AS nombre_motivo,
      pl.descripcion AS nombre_plan,
      rs.razon_social,
      rs.cuil AS cuil_razon_social,
      tc.descripcion AS descripcion_comprobante,
      mon.nombre AS nombre_moneda,
      s.OBRA AS nombre_obra,
      mv.patente AS patente_movil,
      mv.kilometraje AS kilometraje_movil
    FROM factura_compra fc
    JOIN proveedor p ON fc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON fc.id_motivo = m.codigo
    JOIN plandecompra pl ON fc.id_plancompra = pl.codigo
    JOIN razones_sociales rs ON fc.id_razonsocial = rs.id
    JOIN tipocomprobante tc ON fc.tipoCmp = tc.codigo
    JOIN moneda mon ON fc.moneda = mon.codigo
    LEFT JOIN servicios s ON fc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON fc.id_movil = mv.nro_ident
    WHERE fc.anulada = 0 AND fc.fecha BETWEEN ? AND ?
    ORDER BY fc.fecha DESC
  `, [desdeCompleto, hastaCompleto]);
  return rows;
};

const filtrarNotasCredito = async (desdeCompleto, hastaCompleto) => {
  const [rows] = await db.query(`
    SELECT ncc.*,
      DATE_FORMAT(ncc.fecha, '%d/%m/%Y') AS fecha,
      p.Nombre_Prov AS nombre_proveedor,
      p.Cuilt AS cuil_proveedor,
      p.IDSITFISCAL AS id_fiscal_proveedor,
      p.Razon_Social AS razon_social_proveedor,
      m.nombre AS nombre_motivo,
      pl.descripcion AS nombre_plan,
      rs.razon_social,
      rs.cuil AS cuil_razon_social,
      tc.descripcion AS descripcion_comprobante,
      mon.nombre AS nombre_moneda,
      s.OBRA AS nombre_obra,
      mv.patente AS patente_movil,
      mv.kilometraje AS kilometraje_movil
    FROM nota_credito_compra ncc
    JOIN proveedor p ON ncc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON ncc.id_motivo = m.codigo
    JOIN plandecompra pl ON ncc.id_plancompra = pl.codigo
    JOIN razones_sociales rs ON ncc.id_razonsocial = rs.id
    JOIN tipocomprobante tc ON ncc.tipoCmp = tc.codigo
    JOIN moneda mon ON ncc.moneda = mon.codigo
    LEFT JOIN servicios s ON ncc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON ncc.id_movil = mv.nro_ident
    WHERE ncc.anulada = 0 AND ncc.fecha BETWEEN ? AND ?
    ORDER BY ncc.fecha DESC
  `, [desdeCompleto, hastaCompleto]);
  return rows;
};

const getMovimientosNotaCredito = async (codigo) => {
  const [rows] = await db.query(
    'SELECT * FROM movimientos_nota_credito_compra WHERE codigo_nota_credito_compra = ?',
    [codigo]
  );
  return rows;
};

const getOtrosImpuestosNotaCredito = async (codigo) => {
  const [rows] = await db.query(`
    SELECT oi.*, imp.nombre AS nombre_impuesto
    FROM otros_impuestos_nota_credito_compra oi
    JOIN otros_impuestos imp ON oi.codigo_impuesto = imp.codigo
    WHERE oi.codigo_nota_credito_compra = ?
  `, [codigo]);
  return rows;
};

const getFormasPagoNotaCredito = async (codigo) => {
  const [rows] = await db.query(`
    SELECT fp.*, DATE_FORMAT(fp.fecha, '%d/%m/%Y') AS fecha, v.descripcion AS descripcion_valor
    FROM formas_pago_nota_credito_compra fp
    JOIN valores v ON fp.codigo_valor = v.codigo
    WHERE fp.codigo_nota_credito_compra = ?
  `, [codigo]);
  return rows;
};

const getFacturasPorServicio = async (idServicio) => {
  const [rows] = await db.query(`
    SELECT fc.*,
           DATE_FORMAT(fc.fecha, '%d/%m/%Y') AS fecha,
           p.Nombre_Prov AS nombre_proveedor,
           s.OBRA AS nombre_obra,
           pc.descripcion AS nombre_plandecompra
    FROM factura_compra fc
    JOIN proveedor p ON p.Cod_Proveedor = fc.id_proveedor
    JOIN servicios s ON s.IDOBRA = fc.id_servicio
    LEFT JOIN plandecompra pc ON fc.id_plancompra = pc.codigo
    WHERE fc.id_servicio = ?
    ORDER BY fc.id_proveedor;
  `, [idServicio]);
  return rows;
};

const getFacturasPendientes = async () => {
  const [rows] = await db.query(`
    SELECT fc.*,
           DATE_FORMAT(fc.fecha, '%d/%m/%Y') AS fecha,
           p.Nombre_Prov AS nombre_proveedor,
           p.Razon_Social AS razon_social_proveedor,
           p.Cuilt AS cuit_proveedor,
           m.nombre AS nombre_motivo,
           pl.descripcion AS nombre_plan,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           tc.descripcion AS tipo_comprobante,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_obra,
           mv.patente AS patente_movil,
           mv.kilometraje AS kilometraje_movil
    FROM factura_compra fc
    JOIN proveedor p ON fc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON fc.id_motivo = m.codigo
    JOIN plandecompra pl ON fc.id_plancompra = pl.codigo
    JOIN razones_sociales rs ON fc.id_razonsocial = rs.id
    JOIN tipocomprobante tc ON fc.tipoCmp = tc.codigo
    JOIN moneda mon ON fc.moneda = mon.codigo
    LEFT JOIN servicios s ON fc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON fc.id_movil = mv.nro_ident
    WHERE fc.Estado = 'Pendiente'
    ORDER BY fc.fecha DESC;
  `);
  return rows;
};

const existeFactura = async (connection, codigo) => {
  const [rows] = await connection.query('SELECT codigo FROM factura_compra WHERE codigo = ?', [codigo]);
  return rows;
};

const updateFactura = async (connection, params) => {
  const {
    codigoFactura, fecha, tipoCmp, codigoletra, ptoVta, NroCmp, moneda, ctz,
    id_proveedor, id_plancompra, id_motivo, idServicioFinal, idMovilFinal,
    id_responsable, id_razonsocial, totalIVA21, totalIVA27, totalIVA10,
    bonificacion, periodoiva, importe, observacion, estado, saldoFinal
  } = params;

  const query = `
    UPDATE factura_compra SET
      fecha = ?, tipoCmp = ?, codigoletra = ?, ptoVta = ?, NroCmp = ?, moneda = ?, ctz = ?,
      id_proveedor = ?, id_plancompra = ?, id_motivo = ?, id_servicio = ?, id_movil = ?,
      id_responsable = ?, id_razonsocial = ?, totalIVA21 = ?, totalIVA27 = ?, totalIVA10 = ?,
      bonificacion = ?, periodoiva = ?, importe = ?, observacion = ?, Estado = ?, saldo = ?
    WHERE codigo = ?`;

  const values = [
    fecha, tipoCmp, codigoletra, ptoVta, NroCmp, moneda, ctz || 1,
    id_proveedor, id_plancompra, id_motivo, idServicioFinal, idMovilFinal,
    id_responsable || null, id_razonsocial,
    totalIVA21 || 0, totalIVA27 || 0, totalIVA10 || 0,
    bonificacion || 0.00,
    periodoiva || null,
    importe, observacion || null,
    estado || 'Completa',
    saldoFinal,
    codigoFactura
  ];

  await connection.query(query, values);
};

const deleteMovimientosFactura = async (connection, codigo) => {
  await connection.query('DELETE FROM movimientos_factura_compras WHERE codigo_factura_compra = ?', [codigo]);
};

const deleteOtrosImpuestosFactura = async (connection, codigo) => {
  await connection.query('DELETE FROM otros_impuestos_factura_compra WHERE codigo_factura_compra = ?', [codigo]);
};

const deleteFormasPagoFactura = async (connection, codigo) => {
  await connection.query('DELETE FROM formas_pago_factura_compra WHERE codigo_factura_compra = ?', [codigo]);
};

const insertFacturaMovimientosUpdate = async (connection, movimientosData) => {
  const query = `
    INSERT INTO movimientos_factura_compras (
      codigo_factura_compra, tipo_movimiento, id_articulo, id_concepto, id_herramienta,
      unidad, nombre, cantidad, precio, descuento, precio_final, importe, codigo_orden,
      iva_compras, codigo_remito, activo, cantidad_remitos, saldo
    ) VALUES ?`;
  await connection.query(query, [movimientosData]);
};

const getFacturasSinPeriodoIva = async () => {
  const [rows] = await db.query(`
    SELECT fc.*,
           DATE_FORMAT(fc.fecha, '%d/%m/%Y') AS fecha,
           p.Nombre_Prov AS nombre_proveedor,
           p.Razon_Social AS razon_social_proveedor,
           p.Cuilt AS cuit_proveedor,
           m.nombre AS nombre_motivo,
           pl.descripcion AS nombre_plan,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           tc.descripcion AS tipo_comprobante,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_obra,
           mv.patente AS patente_movil,
           mv.kilometraje AS kilometraje_movil
    FROM factura_compra fc
    JOIN proveedor p ON fc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON fc.id_motivo = m.codigo
    JOIN plandecompra pl ON fc.id_plancompra = pl.codigo
    JOIN razones_sociales rs ON fc.id_razonsocial = rs.id
    JOIN tipocomprobante tc ON fc.tipoCmp = tc.codigo
    JOIN moneda mon ON fc.moneda = mon.codigo
    LEFT JOIN servicios s ON fc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON fc.id_movil = mv.nro_ident
    WHERE fc.anulada = 0 AND fc.periodoiva IS NULL
    ORDER BY fc.codigo DESC;
  `);
  return rows;
};

const getFacturasPorProveedor = async (idProveedor, idRazonSocial) => {
  const [rows] = await db.query(`
    SELECT *,
           DATE_FORMAT(fc.fecha, '%d/%m/%Y') AS fecha
    FROM factura_compra fc
    WHERE fc.anulada = 0
      AND fc.saldo > 0
      AND fc.id_proveedor = ?
      AND fc.id_razonsocial = ?
      AND EXISTS (
        SELECT 1
        FROM formas_pago_factura_compra fpf
        WHERE fpf.codigo_factura_compra = fc.codigo
          AND fpf.codigo_valor = 'CC'
      )
    ORDER BY fc.fecha ASC
  `, [idProveedor, idRazonSocial]);
  return rows;
};

const getNotasCreditoPorProveedor = async (idProveedor, idRazonSocial) => {
  const [rows] = await db.query(`
    SELECT *,
           DATE_FORMAT(ncc.fecha, '%d/%m/%Y') AS fecha
    FROM nota_credito_compra ncc
    WHERE ncc.anulada = 0
      AND ncc.saldo > 0
      AND ncc.id_proveedor = ?
      AND ncc.id_razonsocial = ?
      AND EXISTS (
        SELECT 1
        FROM formas_pago_nota_credito_compra fp
        WHERE fp.codigo_nota_credito_compra = ncc.codigo
          AND fp.codigo_valor = 'CC'
      )
    ORDER BY ncc.fecha ASC
  `, [idProveedor, idRazonSocial]);
  return rows;
};

const getFacturasPorRazonSocial = async (idRazonSocial) => {
  const [rows] = await db.query(`
    SELECT fc.*,
      DATE_FORMAT(fc.fecha, '%d/%m/%Y') AS fecha,
      p.Nombre_Prov AS nombre_proveedor,
      p.Razon_Social AS razon_social_proveedor,
      p.Cuilt AS cuit_proveedor,
      m.nombre AS nombre_motivo,
      pl.descripcion AS nombre_plan,
      rs.razon_social AS razon_social_empresa,
      rs.cuil AS cuit_razon_social,
      tc.descripcion AS tipo_comprobante,
      mon.nombre AS nombre_moneda,
      s.OBRA AS nombre_obra,
      mv.patente AS patente_movil,
      mv.kilometraje AS kilometraje_movil
    FROM factura_compra fc
    JOIN proveedor p ON fc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON fc.id_motivo = m.codigo
    JOIN plandecompra pl ON fc.id_plancompra = pl.codigo
    JOIN razones_sociales rs ON fc.id_razonsocial = rs.id
    JOIN tipocomprobante tc ON fc.tipoCmp = tc.codigo
    JOIN moneda mon ON fc.moneda = mon.codigo
    LEFT JOIN servicios s ON fc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON fc.id_movil = mv.nro_ident
    WHERE
      fc.anulada = 0
      AND fc.periodoiva IS NULL
      AND fc.id_razonsocial = ?
      AND fc.tipoCmp NOT IN ('990', '991')
    ORDER BY fc.fecha ASC
  `, [idRazonSocial]);
  return rows;
};

const getNotasCreditoPorRazonSocial = async (idRazonSocial) => {
  const [rows] = await db.query(`
    SELECT ncc.*,
      DATE_FORMAT(ncc.fecha, '%d/%m/%Y') AS fecha,
      p.Nombre_Prov AS nombre_proveedor,
      p.Razon_Social AS razon_social_proveedor,
      p.Cuilt AS cuit_proveedor,
      m.nombre AS nombre_motivo,
      pl.descripcion AS nombre_plan,
      rs.razon_social AS razon_social_empresa,
      rs.cuil AS cuit_razon_social,
      tc.descripcion AS tipo_comprobante,
      mon.nombre AS nombre_moneda,
      s.OBRA AS nombre_obra,
      mv.patente AS patente_movil,
      mv.kilometraje AS kilometraje_movil
    FROM nota_credito_compra ncc
    JOIN proveedor p ON ncc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON ncc.id_motivo = m.codigo
    JOIN plandecompra pl ON ncc.id_plancompra = pl.codigo
    JOIN razones_sociales rs ON ncc.id_razonsocial = rs.id
    JOIN tipocomprobante tc ON ncc.tipoCmp = tc.codigo
    JOIN moneda mon ON ncc.moneda = mon.codigo
    LEFT JOIN servicios s ON ncc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON ncc.id_movil = mv.nro_ident
    WHERE
      ncc.anulada = 0
      AND ncc.periodoiva IS NULL
      AND ncc.id_razonsocial = ?
      AND ncc.tipoCmp NOT IN ('990', '991')
    ORDER BY ncc.fecha ASC
  `, [idRazonSocial]);
  return rows;
};

const getFacturasCostos = async (desdeCompleto, hastaCompleto, connection) => {
  const runner = connection || db;
  const [rows] = await runner.query(`
    SELECT fc.*,
     DATE_FORMAT(fc.fecha, '%d/%m/%Y') AS fecha,
     p.Nombre_Prov AS nombre_proveedor,
     p.Cuilt AS cuil_proveedor,
     p.IDSITFISCAL AS id_fiscal_proveedor,
     p.Razon_Social AS razon_social_proveedor,
     m.nombre AS nombre_motivo,
     pl.descripcion AS nombre_plan,
     tc.clasificacion AS clasificacion_comprobante,
     rs.razon_social,
     rs.cuil AS cuil_razon_social,
     tc.descripcion AS descripcion_comprobante,
     mon.nombre AS nombre_moneda,
     s.OBRA AS nombre_obra,
     mv.patente AS patente_movil,
     mv.kilometraje AS kilometraje_movil
    FROM factura_compra fc
    JOIN proveedor p ON fc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON fc.id_motivo = m.codigo
    JOIN plandecompra pl ON fc.id_plancompra = pl.codigo
    JOIN razones_sociales rs ON fc.id_razonsocial = rs.id
    JOIN tipocomprobante tc ON fc.tipoCmp = tc.codigo
    JOIN moneda mon ON fc.moneda = mon.codigo
    LEFT JOIN servicios s ON fc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON fc.id_movil = mv.nro_ident
    WHERE fc.anulada = 0 AND fc.fecha BETWEEN ? AND ?
    ORDER BY fc.fecha DESC;
  `, [desdeCompleto, hastaCompleto]);
  return rows;
};

const getOtrosPagos = async (desdeCompleto, hastaCompleto, connection) => {
  const runner = connection || db;
  const [rows] = await runner.query(`
    SELECT
      op.*,
      DATE_FORMAT(op.fecha, '%d/%m/%Y') AS fecha,
      m.nombre AS nombre_moneda,
      mo.nombre AS nombre_motivo,
      s.OBRA AS nombre_servicio,
      mv.patente AS patente_movil,
      mv.kilometraje AS kilometraje_movil,
      r.razon_social AS razon_social,
      r.cuil AS cuil_razon_social,
      pc.descripcion AS nombre_plan,
      p.NOMBRE AS nombre_responsable,
      p.DNI AS dni_responsable
    FROM otros_pagos op
    LEFT JOIN moneda m ON op.moneda = m.codigo
    LEFT JOIN motivos mo ON op.id_motivo = mo.codigo
    LEFT JOIN servicios s ON op.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON op.id_movil = mv.nro_ident
    LEFT JOIN razones_sociales r ON op.id_razonsocial = r.id
    LEFT JOIN plandecompra pc ON op.id_plancompra = pc.codigo
    LEFT JOIN personal p ON op.id_responsable = p.ID
    WHERE op.fecha BETWEEN ? AND ?
    ORDER BY op.fecha DESC
  `, [desdeCompleto, hastaCompleto]);
  return rows;
};

const getDetallesOtrosPagos = async (codigo, connection) => {
  const runner = connection || db;
  const [rows] = await runner.query('SELECT * FROM detalle_otros_pagos WHERE codigo_otros_pagos = ?', [codigo]);
  return rows;
};

const getFormasPagoOtrosPagos = async (codigo, connection) => {
  const runner = connection || db;
  const [rows] = await runner.query(`
    SELECT fpop.*, DATE_FORMAT(fpop.fecha, '%d/%m/%Y') AS fecha, v.descripcion AS valor_descripcion
    FROM formas_pago_otros_pagos fpop
    LEFT JOIN valores v ON fpop.codigo_valor = v.codigo
    WHERE fpop.codigo_otros_pagos = ?
  `, [codigo]);
  return rows;
};

const getNotasCreditoCostos = async (desdeCompleto, hastaCompleto, connection) => {
  const runner = connection || db;
  const [rows] = await runner.query(`
    SELECT nc.*,
      DATE_FORMAT(nc.fecha, '%d/%m/%Y') AS fecha,
      p.Nombre_Prov AS nombre_proveedor,
      p.Cuilt AS cuil_proveedor,
      p.IDSITFISCAL AS id_fiscal_proveedor,
      p.Razon_Social AS razon_social_proveedor,
      m.nombre AS nombre_motivo,
      pl.descripcion AS nombre_plan,
      tc.clasificacion AS clasificacion_comprobante,
      rs.razon_social,
      rs.cuil AS cuil_razon_social,
      tc.descripcion AS descripcion_comprobante,
      mon.nombre AS nombre_moneda,
      s.OBRA AS nombre_obra,
      mv.patente AS patente_movil,
      mv.kilometraje AS kilometraje_movil
    FROM nota_credito_compra nc
    JOIN proveedor p ON nc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON nc.id_motivo = m.codigo
    JOIN plandecompra pl ON nc.id_plancompra = pl.codigo
    JOIN razones_sociales rs ON nc.id_razonsocial = rs.id
    JOIN tipocomprobante tc ON nc.tipoCmp = tc.codigo
    JOIN moneda mon ON nc.moneda = mon.codigo
    LEFT JOIN servicios s ON nc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON nc.id_movil = mv.nro_ident
    WHERE nc.anulada = 0 AND nc.fecha BETWEEN ? AND ?
    ORDER BY nc.fecha DESC;
  `, [desdeCompleto, hastaCompleto]);
  return rows;
};

const getOrdenesPago = async (desdeCompleto, hastaCompleto, connection) => {
  const runner = connection || db;
  const [rows] = await runner.query(`
    SELECT
      op.*,
      DATE_FORMAT(op.fecha, '%d/%m/%Y') AS fecha,
      p.Nombre_Prov AS nombre_proveedor,
      p.Cuilt AS cuil_proveedor,
      p.IDSITFISCAL AS id_fiscal_proveedor,
      p.Razon_Social AS razon_social_proveedor,
      rs.razon_social,
      rs.cuil AS cuil_razon_social,
      mon.nombre AS nombre_moneda,
      per_c.NOMBRE AS nombre_creado,
      per_m.NOMBRE AS nombre_modificado
    FROM orden_pago op
    JOIN proveedor p ON op.id_proveedor = p.Cod_Proveedor
    JOIN razones_sociales rs ON op.id_razonsocial = rs.id
    JOIN moneda mon ON op.moneda = mon.codigo
    LEFT JOIN personal per_c ON op.id_creado = per_c.ID
    LEFT JOIN personal per_m ON op.id_modificado = per_m.ID
    WHERE op.fecha BETWEEN ? AND ?
    ORDER BY op.fecha DESC
  `, [desdeCompleto, hastaCompleto]);
  return rows;
};

const getDetalleOrdenPago = async (codigo, connection) => {
  const runner = connection || db;
  const [rows] = await runner.query('SELECT * FROM detalle_orden_pago WHERE codigo_orden_pago = ?', [codigo]);
  return rows;
};

const getFormasPagoOrdenPago = async (codigo, connection) => {
  const runner = connection || db;
  const [rows] = await runner.query('SELECT *, DATE_FORMAT(fecha, \'%d/%m/%Y\') AS fecha FROM formas_pago_orden_pago WHERE codigo_orden_pago = ?', [codigo]);
  return rows;
};

const getOtrosImpuestosOrdenPago = async (codigo, connection) => {
  const runner = connection || db;
  const [rows] = await runner.query(`
    SELECT oi.*, imp.nombre AS nombre_impuesto
    FROM otros_impuestos_orden_pago oi
    JOIN otros_impuestos imp ON oi.codigo_impuesto = imp.codigo
    WHERE oi.codigo_orden_pago = ?
  `, [codigo]);
  return rows;
};

const getImpuestos = async (desdeCompleto, hastaCompleto, connection) => {
  const runner = connection || db;
  const [rows] = await runner.query(`
    SELECT
      DATE_FORMAT(fc.fecha, '%d/%m/%Y') AS fecha,
      fc.codigo AS codigo_documento,
      oi.codigo AS codigo_impuesto,
      oi.nombre AS nombre_impuesto,
      oifc.valor AS importe,
      CASE WHEN oi.codigo = 'IMP-005' THEN 'RECURSOS HUMANOS' ELSE 'IMPUESTOS' END AS nombre_motivo,
      CASE WHEN oi.codigo = 'IMP-005' THEN 'RRH' ELSE 'IMP' END AS codigo_motivo,
      'factura_compra' AS tipo
    FROM factura_compra fc
    JOIN otros_impuestos_factura_compra oifc ON fc.codigo = oifc.codigo_factura_compra
    JOIN otros_impuestos oi ON oifc.codigo_impuesto = oi.codigo
    WHERE fc.fecha BETWEEN ? AND ?

    UNION ALL

    SELECT
      DATE_FORMAT(nc.fecha, '%d/%m/%Y') AS fecha,
      nc.codigo AS codigo_documento,
      oi.codigo AS codigo_impuesto,
      oi.nombre AS nombre_impuesto,
      oinc.valor AS importe,
      CASE WHEN oi.codigo = 'IMP-005' THEN 'RECURSOS HUMANOS' ELSE 'IMPUESTOS' END AS nombre_motivo,
      CASE WHEN oi.codigo = 'IMP-005' THEN 'RRH' ELSE 'IMP' END AS codigo_motivo,
      'nota_credito_compra' AS tipo
    FROM nota_credito_compra nc
    JOIN otros_impuestos_nota_credito_compra oinc ON nc.codigo = oinc.codigo_nota_credito_compra
    JOIN otros_impuestos oi ON oinc.codigo_impuesto = oi.codigo
    WHERE nc.fecha BETWEEN ? AND ?

    UNION ALL

    SELECT
      DATE_FORMAT(r.fecha, '%d/%m/%Y') AS fecha,
      r.codigo AS codigo_documento,
      oi.codigo AS codigo_impuesto,
      oi.nombre AS nombre_impuesto,
      oir.valor AS importe,
      CASE WHEN oi.codigo = 'IMP-005' THEN 'RECURSOS HUMANOS' ELSE 'IMPUESTOS' END AS nombre_motivo,
      CASE WHEN oi.codigo = 'IMP-005' THEN 'RRH' ELSE 'IMP' END AS codigo_motivo,
      'recibo' AS tipo
    FROM recibo r
    JOIN otros_impuestos_recibo oir ON r.codigo = oir.codigo_recibo
    JOIN otros_impuestos oi ON oir.codigo_impuesto = oi.codigo
    WHERE r.fecha BETWEEN ? AND ?

    UNION ALL

    SELECT
      DATE_FORMAT(op.fecha, '%d/%m/%Y') AS fecha,
      op.codigo AS codigo_documento,
      oi.codigo AS codigo_impuesto,
      oi.nombre AS nombre_impuesto,
      oiop.valor AS importe,
      CASE WHEN oi.codigo = 'IMP-005' THEN 'RECURSOS HUMANOS' ELSE 'IMPUESTOS' END AS nombre_motivo,
      CASE WHEN oi.codigo = 'IMP-005' THEN 'RRH' ELSE 'IMP' END AS codigo_motivo,
      'orden_pago' AS tipo
    FROM orden_pago op
    JOIN otros_impuestos_orden_pago oiop ON op.codigo = oiop.codigo_orden_pago
    JOIN otros_impuestos oi ON oiop.codigo_impuesto = oi.codigo
    WHERE op.fecha BETWEEN ? AND ?

    ORDER BY STR_TO_DATE(fecha, '%d/%m/%Y') DESC, nombre_impuesto ASC
  `, [desdeCompleto, hastaCompleto, desdeCompleto, hastaCompleto, desdeCompleto, hastaCompleto, desdeCompleto, hastaCompleto]);
  return rows;
};

const getRelaciones = async (factura) => {
  const sql = `
    SELECT
        r.id AS relacion_id,
        r.orden_compra AS orden,
        r.remito AS remito,
        r.factura AS factura,
        f.codigo AS codigo,
        DATE_FORMAT(f.fecha, '%d/%m/%Y') AS fecha,
        f.ptoVta,
        f.NroCmp,
        f.codigoletra,
        prov.Nombre_Prov AS nombre_proveedor,
        prov.Razon_Social AS razon_social_proveedor,
        rs.razon_social AS razon_social_factura,
        'remito_orden' AS tabla
    FROM remito_orden r
    INNER JOIN factura_compra f ON r.factura = f.codigo
    INNER JOIN orden_compra oc ON r.orden_compra = oc.codigo
    INNER JOIN proveedor prov ON oc.id_proveedor = prov.Cod_Proveedor
    INNER JOIN razones_sociales rs ON oc.id_razon_social = rs.id
    WHERE r.factura = ?

    UNION ALL

    SELECT
        rf.id AS relacion_id,
        NULL AS orden,
        rf.remito AS remito,
        rf.factura AS factura,
        f.codigo AS codigo,
        DATE_FORMAT(f.fecha, '%d/%m/%Y') AS fecha,
        f.ptoVta,
        f.NroCmp,
        f.codigoletra,
        prov.Nombre_Prov AS nombre_proveedor,
        prov.Razon_Social AS razon_social_proveedor,
        NULL AS razon_social_factura,
        'remito_factura' AS tabla
    FROM remito_factura rf
    INNER JOIN factura_compra f ON rf.factura = f.codigo
    INNER JOIN remito_compra rc ON rf.remito = rc.codigo
    INNER JOIN proveedor prov ON rc.id_proveedor = prov.Cod_Proveedor
    WHERE rf.factura = ?;
  `;
  const [rows] = await db.query(sql, [factura, factura]);
  return rows;
};

const insertRelacionOrden = async (ordenCompra, codigo) => {
  const [result] = await db.query('INSERT INTO remito_orden (orden_compra, remito) VALUES (?, ?)', [ordenCompra, codigo]);
  return result.insertId;
};

const insertRelacionFacturaOrden = async (codigo, factura) => {
  const [result] = await db.query('INSERT INTO remito_orden (orden_compra, factura) VALUES (?, ?)', [codigo, factura]);
  return result.insertId;
};

const insertRelacionFacturaRemito = async (codigo, factura) => {
  const [result] = await db.query('INSERT INTO remito_factura (remito, factura) VALUES (?, ?)', [codigo, factura]);
  return result.insertId;
};

const getIndicadoresFormaPago = async () => {
  const [rows] = await db.query(`
    SELECT
      v.descripcion AS forma_pago,
      COUNT(DISTINCT fpc.codigo_factura_compra) AS total_facturas,
      ROUND(
        100 * COUNT(DISTINCT fpc.codigo_factura_compra) /
        (SELECT COUNT(*) FROM factura_compra),
        2
      ) AS porcentaje
    FROM formas_pago_factura_compra fpc
    INNER JOIN valores v ON fpc.codigo_valor = v.codigo
    GROUP BY v.descripcion
  `);
  return rows;
};

const getTotalesSaldo = async () => {
  const [[totales]] = await db.query(`
    SELECT
      COUNT(*) AS total_facturas,
      SUM(CASE WHEN saldo = 0 THEN 1 ELSE 0 END) AS saldo_cero,
      SUM(CASE WHEN saldo = importe THEN 1 ELSE 0 END) AS saldo_igual_importe,
      SUM(CASE WHEN saldo > 0 AND saldo < importe THEN 1 ELSE 0 END) AS saldo_parcial
    FROM factura_compra
  `);
  return totales;
};

const deleteRelacionOrdenFactura = async (codigo, factura) => {
  const [result] = await db.query('DELETE FROM remito_orden WHERE orden_compra = ? AND factura = ?', [codigo, factura]);
  return result.affectedRows;
};

const deleteRelacionRemitoFactura = async (codigo, factura) => {
  const [result] = await db.query('DELETE FROM remito_factura WHERE remito = ? AND factura = ?', [codigo, factura]);
  return result.affectedRows;
};

const getCostosPorServicio = async (idServicio) => {
  const [rows] = await db.query(`
    SELECT
        fc.codigo AS codigo_factura,
        DATE_FORMAT(fc.fecha, '%d/%m/%Y') AS fecha_factura,
        pc.codigo AS codigo_plan,
        pc.descripcion AS descripcion_plan,
        mfc.nombre AS nombre_movimiento,
        mfc.importe AS importe_movimiento
    FROM factura_compra fc
    INNER JOIN plandecompra pc
        ON fc.id_plancompra = pc.codigo
    INNER JOIN movimientos_factura_compras mfc
        ON fc.codigo = mfc.codigo_factura_compra
    WHERE fc.id_servicio = ?
      AND fc.id_plancompra <> '411020301';
  `, [idServicio]);
  return rows;
};

module.exports = {
  getConnection,
  beginTransaction,
  commit,
  rollback,
  release,
  getLastCodigo,
  insertFactura,
  insertMovimientos,
  findEppVariant,
  updateEppVariant,
  insertEppVariant,
  insertOtrosImpuestos,
  insertFormasPago,
  insertRemitoOrden,
  insertRemitoFactura,
  getFacturas,
  getMovimientosFactura,
  getOtrosImpuestosFactura,
  getFormasPagoFactura,
  getFacturaByCodigo,
  anularFactura,
  filtrarFacturas,
  filtrarNotasCredito,
  getMovimientosNotaCredito,
  getOtrosImpuestosNotaCredito,
  getFormasPagoNotaCredito,
  getFacturasPorServicio,
  getFacturasPendientes,
  existeFactura,
  updateFactura,
  deleteMovimientosFactura,
  deleteOtrosImpuestosFactura,
  deleteFormasPagoFactura,
  insertFacturaMovimientosUpdate,
  getFacturasSinPeriodoIva,
  getFacturasPorProveedor,
  getNotasCreditoPorProveedor,
  getFacturasPorRazonSocial,
  getNotasCreditoPorRazonSocial,
  getFacturasCostos,
  getOtrosPagos,
  getDetallesOtrosPagos,
  getFormasPagoOtrosPagos,
  getNotasCreditoCostos,
  getOrdenesPago,
  getDetalleOrdenPago,
  getFormasPagoOrdenPago,
  getOtrosImpuestosOrdenPago,
  getImpuestos,
  getRelaciones,
  insertRelacionOrden,
  insertRelacionFacturaOrden,
  insertRelacionFacturaRemito,
  getIndicadoresFormaPago,
  getTotalesSaldo,
  deleteRelacionOrdenFactura,
  deleteRelacionRemitoFactura,
  getCostosPorServicio,
};
