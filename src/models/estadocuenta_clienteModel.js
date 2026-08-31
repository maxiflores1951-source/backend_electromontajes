const db = require('../../db');

const getPresupuestosCompleto = async (clienteId) => {
  const query = `
    SELECT 
      p.codigo as presupuesto_codigo,
      p.fecha as presupuesto_fecha,
      p.id_servicio,
      s.OBRA as servicio_nombre,
      p.denominacion as presupuesto_denominacion,
      p.moneda as presupuesto_moneda,
      p.ctz as presupuesto_cotizacion,
      p.importe as presupuesto_importe,
      p.importe_sin_iva as presupuesto_importe_sin_iva,
      p.iva21 as presupuesto_iva,
      p.saldo as presupuesto_saldo,
      p.saldo_sin_iva as presupuesto_saldo_sin_iva,
      p.estado as presupuesto_estado,

      dp.item as item_numero,
      dp.descripcion as item_descripcion,
      dp.cantidad as item_cantidad,
      dp.precio_unitario as item_precio_unitario,
      dp.importe as item_importe,

      fv.codigo as factura_codigo,
      fv.fecha as factura_fecha,
      CONCAT(fv.codigoletra, ' ', LPAD(fv.ptoVta, 4, '0'), '-', LPAD(fv.NroCmp, 8, '0')) as factura_numero_completo,
      fv.tipoCmp as factura_tipo,
      fv.moneda as factura_moneda,
      fv.ctz as factura_cotizacion,
      fv.importe as factura_importe,
      fv.iva21 as factura_iva21,
      fv.iva27 as factura_iva27,
      fv.iva105 as factura_iva105,
      fv.saldo as factura_saldo,
      fv.estado as factura_estado,

      dfv.descripcion as factura_detalle_descripcion,
      dfv.importe as factura_detalle_importe,
      dfv.iva as factura_detalle_iva,

      fp.id as forma_pago_id,
      fp.codigo_valor as codigo_valor,
      v.descripcion as descripcion_valor,
      fp.fecha as forma_pago_fecha,
      fp.importe as forma_pago_importe,

      r.codigo as recibo_codigo,
      r.fecha as recibo_fecha,
      r.NroCmp as recibo_numero,
      r.moneda as recibo_moneda,
      r.ctz as recibo_cotizacion,
      r.importe as recibo_importe_total,
      r.observacion as recibo_observacion,

      dr.pago as recibo_pago_aplicado,

      (p.importe - p.saldo) as presupuesto_cobrado,
      (fv.importe - fv.saldo) as factura_cobrado,
      CASE 
        WHEN p.saldo = 0 THEN 'COBRADO'
        WHEN p.saldo = p.importe THEN 'PENDIENTE'
        ELSE 'PARCIAL'
      END as presupuesto_estado_cobranza,
      CASE 
        WHEN fv.saldo = 0 THEN 'COBRADO'
        WHEN fv.saldo = fv.importe THEN 'PENDIENTE'
        ELSE 'PARCIAL'
      END as factura_estado_cobranza

    FROM presupuesto p
    LEFT JOIN servicios s ON p.id_servicio = s.IDOBRA
    LEFT JOIN detalle_presupuesto dp ON p.codigo = dp.codigo_presupuesto
    LEFT JOIN detalle_factura_venta dfv ON p.codigo = dfv.codigo_presupuesto
    LEFT JOIN factura_venta fv ON dfv.codigo_factura_venta = fv.codigo
    LEFT JOIN formas_pago_factura_venta fp ON fv.codigo = fp.codigo_factura_venta
    LEFT JOIN valores v ON v.codigo = fp.codigo_valor
    LEFT JOIN detalle_recibo dr ON fv.codigo = dr.codigo_factura_venta
    LEFT JOIN recibo r ON dr.codigo_recibo = r.codigo
    
    WHERE p.id_cliente = ?
    
    ORDER BY 
      p.id_servicio,
      p.codigo,
      dp.item,
      fv.codigo,
      fp.id,
      r.codigo
  `;
  const [rows] = await db.query(query, [clienteId]);
  return rows;
};

const getResumenServicios = async (clienteId) => {
  const query = `
    SELECT 
      p.id_servicio,
      s.OBRA as servicio_nombre,
      COUNT(DISTINCT p.codigo) as total_presupuestos,
      SUM(p.importe) as total_importe,
      SUM(p.importe_sin_iva) as total_sin_iva,
      SUM(p.iva21) as total_iva,
      SUM(p.saldo) as total_saldo,
      SUM(p.importe - p.saldo) as total_cobrado
    FROM presupuesto p
    LEFT JOIN servicios s ON p.id_servicio = s.IDOBRA
    WHERE p.id_cliente = ?
    GROUP BY p.id_servicio, s.OBRA
    ORDER BY p.id_servicio
  `;
  const [rows] = await db.query(query, [clienteId]);
  return rows;
};

module.exports = {
  getPresupuestosCompleto,
  getResumenServicios,
};
