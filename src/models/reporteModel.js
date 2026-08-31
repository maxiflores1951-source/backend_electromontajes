const db = require('../../db');

const getFormasPago = async (desdeCompleto, hastaCompleto) => {
  const query = `
    SELECT 
      fpc.codigo_caja      AS codigo_comprobante,
      fpc.codigo_valor     AS codigo_valor,
      v.descripcion        AS descripcion_valor,
      fpc.importe,
      fpc.fecha,
      c.estado,
      c.operacion,
      NULL AS tipoCmp,
      'CAJA' AS origen
    FROM formas_pago_caja fpc
    JOIN valores v ON v.codigo = fpc.codigo_valor
    JOIN caja c ON c.codigo = fpc.codigo_caja
    WHERE fpc.fecha BETWEEN ? AND ?

    UNION ALL

    SELECT 
      fpf.codigo_factura_compra AS codigo_comprobante,
      fpf.codigo_valor          AS codigo_valor,
      v.descripcion             AS descripcion_valor,
      fpf.importe,
      fpf.fecha,
      NULL AS estado,
      NULL AS operacion,
      fc.tipoCmp AS tipoCmp,
      'FACTURA_COMPRA' AS origen
    FROM formas_pago_factura_compra fpf
    JOIN valores v ON v.codigo = fpf.codigo_valor
    JOIN factura_compra fc ON fc.codigo = fpf.codigo_factura_compra
    WHERE fpf.fecha BETWEEN ? AND ?

    UNION ALL

    SELECT 
      fpv.codigo_factura_venta AS codigo_comprobante,
      fpv.codigo_valor               AS codigo_valor,
      v.descripcion            AS descripcion_valor,
      fpv.importe,
      fpv.fecha,
      NULL AS estado,
      NULL AS operacion,
      NULL AS tipoCmp,
      'FACTURA_VENTA' AS origen
    FROM formas_pago_factura_venta fpv
    JOIN valores v ON v.codigo = fpv.codigo_valor
    WHERE fpv.fecha BETWEEN ? AND ?

    UNION ALL

    SELECT 
      fpo.codigo_orden_pago AS codigo_comprobante,
      fpo.codigo_valor            AS codigo_valor,
      v.descripcion         AS descripcion_valor,
      fpo.importe,
      fpo.fecha,
      NULL AS estado,
      NULL AS operacion,
      NULL AS tipoCmp,
      'ORDEN_PAGO' AS origen
    FROM formas_pago_orden_pago fpo
    JOIN valores v ON v.codigo = fpo.codigo_valor
    WHERE fpo.fecha BETWEEN ? AND ?

    UNION ALL

    SELECT 
      fpop.codigo_otros_pagos AS codigo_comprobante,
      fpop.codigo_valor       AS codigo_valor,
      v.descripcion           AS descripcion_valor,
      fpop.importe,
      fpop.fecha,
      NULL AS estado,
      NULL AS operacion,
      NULL AS tipoCmp,
      'OTROS_PAGOS' AS origen
    FROM formas_pago_otros_pagos fpop
    JOIN valores v ON v.codigo = fpop.codigo_valor
    WHERE fpop.fecha BETWEEN ? AND ?

    UNION ALL

    SELECT 
      fpr.codigo_recibo       AS codigo_comprobante,
      fpr.codigo_valor        AS codigo_valor,
      v.descripcion           AS descripcion_valor,
      fpr.importe,
      fpr.fecha,
      NULL AS estado,
      NULL AS operacion,
      NULL AS tipoCmp,
      'RECIBO' AS origen
    FROM formas_pago_recibo fpr
    JOIN valores v ON v.codigo = fpr.codigo_valor
    WHERE fpr.fecha BETWEEN ? AND ?
  `;
  const [rows] = await db.query(query, [
    desdeCompleto, hastaCompleto,
    desdeCompleto, hastaCompleto,
    desdeCompleto, hastaCompleto,
    desdeCompleto, hastaCompleto,
    desdeCompleto, hastaCompleto,
    desdeCompleto, hastaCompleto,
  ]);
  return rows;
};

module.exports = {
  getFormasPago,
};
