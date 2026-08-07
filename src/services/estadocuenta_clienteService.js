const estadocuentaClienteModel = require('../models/estadocuenta_clienteModel');

const estructurarDatos = (rows) => {
  const presupuestos = {};

  rows.forEach(row => {
    const presupuestoCodigo = row.presupuesto_codigo;

    if (!presupuestos[presupuestoCodigo]) {
      presupuestos[presupuestoCodigo] = {
        codigo: row.presupuesto_codigo,
        fecha: row.presupuesto_fecha,
        servicio: {
          id: row.id_servicio,
          nombre: row.servicio_nombre,
        },
        denominacion: row.presupuesto_denominacion,
        moneda: row.presupuesto_moneda,
        cotizacion: parseFloat(row.presupuesto_cotizacion),
        importe: parseFloat(row.presupuesto_importe),
        importe_sin_iva: parseFloat(row.presupuesto_importe_sin_iva),
        iva: parseFloat(row.presupuesto_iva),
        saldo: parseFloat(row.presupuesto_saldo),
        saldo_sin_iva: parseFloat(row.presupuesto_saldo_sin_iva),
        cobrado: parseFloat(row.presupuesto_cobrado),
        estado: row.presupuesto_estado,
        estado_cobranza: row.presupuesto_estado_cobranza,
        items: [],
        facturas: [],
      };
    }

    const presupuesto = presupuestos[presupuestoCodigo];

    if (row.item_numero) {
      const itemExiste = presupuesto.items.some(i => i.numero === row.item_numero);
      if (!itemExiste) {
        presupuesto.items.push({
          numero: row.item_numero,
          descripcion: row.item_descripcion,
          cantidad: parseFloat(row.item_cantidad),
          precio_unitario: parseFloat(row.item_precio_unitario),
          importe: parseFloat(row.item_importe),
        });
      }
    }

    if (row.factura_codigo) {
      let factura = presupuesto.facturas.find(f => f.codigo === row.factura_codigo);

      if (!factura) {
        factura = {
          codigo: row.factura_codigo,
          fecha: row.factura_fecha,
          numero_completo: row.factura_numero_completo,
          tipo: row.factura_tipo,
          moneda: row.factura_moneda,
          cotizacion: parseFloat(row.factura_cotizacion),
          importe: parseFloat(row.factura_importe),
          iva21: parseFloat(row.factura_iva21),
          iva27: parseFloat(row.factura_iva27),
          iva105: parseFloat(row.factura_iva105),
          saldo: parseFloat(row.factura_saldo),
          cobrado: parseFloat(row.factura_cobrado),
          estado: row.factura_estado,
          estado_cobranza: row.factura_estado_cobranza,
          formas_pago: [],
          recibos: [],
        };
        presupuesto.facturas.push(factura);
      }

      if (row.forma_pago_id) {
        const fpExiste = factura.formas_pago.some(fp => fp.id === row.forma_pago_id);
        if (!fpExiste) {
          factura.formas_pago.push({
            id: row.forma_pago_id,
            codigo: row.forma_pago_codigo,
            descripcion: row.forma_pago_descripcion,
            fecha: row.forma_pago_fecha,
            importe: parseFloat(row.forma_pago_importe),
          });
        }
      }

      if (row.recibo_codigo) {
        const reciboExiste = factura.recibos.some(r => r.codigo === row.recibo_codigo);
        if (!reciboExiste) {
          factura.recibos.push({
            codigo: row.recibo_codigo,
            fecha: row.recibo_fecha,
            numero: row.recibo_numero,
            moneda: row.recibo_moneda,
            cotizacion: parseFloat(row.recibo_cotizacion),
            importe_total: parseFloat(row.recibo_importe_total),
            pago_aplicado: parseFloat(row.recibo_pago_aplicado),
            observacion: row.recibo_observacion,
          });
        }
      }
    }
  });

  return Object.values(presupuestos);
};

const getPresupuestosCompleto = async (clienteId) => {
  const rows = await estadocuentaClienteModel.getPresupuestosCompleto(clienteId);
  return estructurarDatos(rows);
};

const getResumenServicios = async (clienteId) => {
  const rows = await estadocuentaClienteModel.getResumenServicios(clienteId);
  return rows.map(row => ({
    servicio: {
      id: row.id_servicio,
      nombre: row.servicio_nombre,
    },
    total_presupuestos: row.total_presupuestos,
    total_importe: parseFloat(row.total_importe),
    total_sin_iva: parseFloat(row.total_sin_iva),
    total_iva: parseFloat(row.total_iva),
    total_saldo: parseFloat(row.total_saldo),
    total_cobrado: parseFloat(row.total_cobrado),
  }));
};

module.exports = {
  getPresupuestosCompleto,
  getResumenServicios,
};
