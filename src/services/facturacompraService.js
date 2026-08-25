const facturacompraModel = require('../models/facturacompraModel');

const parseFecha = (valor) => {
  if (!valor) return 0;
  const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(valor));
  return partes
    ? new Date(+partes[3], partes[2] - 1, +partes[1]).getTime()
    : new Date(valor).getTime();
};

const toMysqlFecha = (valor) => {
  if (!valor) return valor;
  const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(valor));
  return partes
    ? `${partes[3]}-${partes[2].padStart(2, '0')}-${partes[1].padStart(2, '0')}`
    : valor;
};

const extraerCodigoRelacion = (r) =>
  typeof r === 'string'
    ? r
    : (r?.codigo ?? r?.codigo_orden ?? r?.codigo_remito ?? r?.orden_compra ?? r?.remito ?? null);

const generarCodigoFactura = async (connection) => {
  const ultimoCodigo = await facturacompraModel.getLastCodigo(connection);
  const parte1 = 'FC00001';

  if (!ultimoCodigo) {
    return `${parte1}-00000001`;
  } else {
    const partes = ultimoCodigo.split('-');
    const parte2 = partes.length > 1 ? partes[1] : '00000000';

    const numero = parseInt(parte2, 10);
    const nuevoNumero = isNaN(numero) ? 1 : numero + 1;

    return `${parte1}-${nuevoNumero.toString().padStart(8, '0')}`;
  }
};

const create = async (data, idPersonal) => {
  const {
    fecha,
    tipoCmp,
    codigoletra,
    ptoVta,
    NroCmp,
    moneda,
    ctz,
    id_proveedor,
    id_plancompra,
    id_motivo,
    id_servicio,
    id_movil,
    id_razonsocial,
    totalIVA21,
    totalIVA27,
    totalIVA10,
    bonificacion,
    periodoiva,
    importe,
    observacion,
    estado,
    item,
    otrosimpuestos,
    formasDePago,
    saldo,
    relacion
  } = data;

  if (!fecha || !tipoCmp || !codigoletra || !ptoVta || !NroCmp ||
      !moneda || !id_proveedor || !id_plancompra || !id_motivo ||
      !id_razonsocial || !importe) {
    throw new Error('Faltan datos obligatorios en la factura de compra');
  }

  const saldoFinal = typeof saldo === 'number' && !isNaN(saldo) ? saldo : 0;
  const idResponsable = idPersonal || data.id_responsable || null;
  const idCreacion = idPersonal || data.id_creacion || null;

  const connection = await facturacompraModel.getConnection();

  try {
    await facturacompraModel.beginTransaction(connection);

    const codigoFactura = await generarCodigoFactura(connection);

    await facturacompraModel.insertFactura(connection, {
      codigoFactura,
      fecha: toMysqlFecha(fecha),
      tipoCmp,
      codigoletra,
      ptoVta,
      NroCmp,
      moneda,
      ctz,
      id_proveedor,
      id_plancompra,
      id_motivo,
      id_servicio,
      id_movil,
      id_responsable: idResponsable,
      id_razonsocial,
      totalIVA21,
      totalIVA27,
      totalIVA10,
      bonificacion,
      periodoiva,
      importe,
      observacion,
      estado,
      saldoFinal
    });

    if (item && item.length > 0) {
      const movimientosData = item.map(({
        tipo_operacion,
        id_articulo,
        id_concepto,
        id_herramienta,
        id_epp,
        unidad,
        nombre,
        cantidad,
        precio_final,
        importe,
        codigo_orden,
        iva_compras,
        descuento,
        codigo_remito,
        cantidad_remitos,
        saldo
      }) => {
        if (!nombre || !unidad || cantidad == null || precio_final == null) {
          throw new Error(`Datos incompletos para el item: ${JSON.stringify({ nombre, unidad, cantidad, precio_final })}`);
        }

        return [
          codigoFactura,
          tipo_operacion,
          id_articulo ?? null,
          id_concepto ?? null,
          id_herramienta ?? null,
          id_epp ?? null,
          unidad,
          nombre,
          cantidad,
          precio_final,
          descuento ?? 0,
          precio_final,
          importe ?? 0,
          codigo_orden ?? null,
          iva_compras ?? 0,
          codigo_remito ?? null,
          1,
          cantidad_remitos ?? 0,
          saldo ?? 0
        ];
      });

      await facturacompraModel.insertMovimientos(connection, movimientosData);

      for (const movimiento of item) {
        if (movimiento.id_epp && movimiento.tipo_operacion?.toLowerCase() === 'epp') {
          const {
            id_epp,
            id_color,
            id_talla,
            id_marca,
            codigo_tipo,
            cantidad
          } = movimiento;

          if (!codigo_tipo) {
            throw new Error(`El campo codigo_tipo es obligatorio para EPP: ${id_epp}`);
          }

          const codigoEpp = parseInt(id_epp);
          const colorId = id_color ? parseInt(id_color) : null;
          const tallaId = id_talla ? parseInt(id_talla) : null;
          const marcaId = id_marca ? parseInt(id_marca) : null;
          const cantidadNum = parseFloat(cantidad);

          const existingVariant = await facturacompraModel.findEppVariant(connection, {
            codigoEpp,
            colorId,
            tallaId,
            marcaId,
            codigo_tipo
          });

          if (existingVariant && existingVariant.length > 0) {
            const variantId = existingVariant[0].id;
            const cantidadActual = existingVariant[0].cantidad;
            const nuevaCantidad = cantidadActual + cantidadNum;

            await facturacompraModel.updateEppVariant(connection, {
              nuevaCantidad,
              id_creacion: idCreacion,
              variantId
            });
          } else {
            await facturacompraModel.insertEppVariant(connection, {
              codigoEpp,
              colorId,
              tallaId,
              marcaId,
              codigo_tipo,
              cantidadNum,
              id_creacion: idCreacion
            });
          }
        }
      }
    }

    if (otrosimpuestos && otrosimpuestos.length > 0) {
      const impuestosData = otrosimpuestos.map(({ codigo, codigo_impuesto, valor }) => {
        const codigoImpuesto = codigo ?? codigo_impuesto;
        if (!codigoImpuesto || valor == null) {
          throw new Error(`Datos incompletos para impuesto: ${JSON.stringify({ codigo, valor })}`);
        }
        return [codigoFactura, codigoImpuesto, valor];
      });

      await facturacompraModel.insertOtrosImpuestos(connection, impuestosData);
    }

    if (formasDePago && formasDePago.length > 0) {
      const formasPagoData = formasDePago.map(({ codigo, codigo_valor, fecha, importe }) => {
        const codigoFormaPago = codigo ?? codigo_valor;
        if (!codigoFormaPago || !fecha || importe == null) {
          throw new Error(`Datos incompletos para forma de pago`);
        }
        return [codigoFactura, codigoFormaPago, toMysqlFecha(fecha), importe];
      });

      await facturacompraModel.insertFormasPago(connection, formasPagoData);
    }

    if (relacion && Array.isArray(relacion)) {
      for (const elemento of relacion) {
        const codigo = extraerCodigoRelacion(elemento);
        if (!codigo) continue;

        if (codigo.startsWith('OC')) {
          await facturacompraModel.insertRemitoOrden(connection, codigo, codigoFactura);
        }

        if (codigo.startsWith('RC')) {
          await facturacompraModel.insertRemitoFactura(connection, codigoFactura, codigo);
        }
      }
    }

    await facturacompraModel.commit(connection);
    return codigoFactura;
  } catch (error) {
    await facturacompraModel.rollback(connection);
    throw error;
  } finally {
    await facturacompraModel.release(connection);
  }
};

const getAll = async () => {
  const facturasCompra = await facturacompraModel.getFacturas();

  const facturasCompletas = await Promise.all(facturasCompra.map(async (factura) => {
    const movimientos = await facturacompraModel.getMovimientosFactura(factura.codigo);
    const otrosImpuestos = await facturacompraModel.getOtrosImpuestosFactura(factura.codigo);
    const formasPago = await facturacompraModel.getFormasPagoFactura(factura.codigo);

    return {
      ...factura,
      movimientos,
      otrosImpuestos,
      formasPago
    };
  }));

  return facturasCompletas;
};

const anular = async (codigo) => {
  if (!codigo) throw new Error('Código de factura requerido');

  const facturas = await facturacompraModel.getFacturaByCodigo(codigo);
  if (facturas.length === 0) throw new Error('Factura no encontrada');

  await facturacompraModel.anularFactura(codigo);
  return true;
};

const filtrar = async (desde, hasta) => {
  if (!desde || !hasta) {
    throw new Error('Faltan las fechas desde y hasta');
  }

  const desdeCompleto = `${desde} 00:00:00`;
  const hastaCompleto = `${hasta} 23:59:59`;

  const facturasCompra = await facturacompraModel.filtrarFacturas(desdeCompleto, hastaCompleto);
  const notasCreditoCompra = await facturacompraModel.filtrarNotasCredito(desdeCompleto, hastaCompleto);

  const facturasCompletas = await Promise.all(facturasCompra.map(async (factura) => {
    const movimientos = await facturacompraModel.getMovimientosFactura(factura.codigo);
    const otrosImpuestos = await facturacompraModel.getOtrosImpuestosFactura(factura.codigo);
    const formasPago = await facturacompraModel.getFormasPagoFactura(factura.codigo);

    return {
      tipo_documento: 'factura',
      ...factura,
      movimientos,
      otrosImpuestos,
      formasPago
    };
  }));

  const notasCreditoCompletas = await Promise.all(notasCreditoCompra.map(async (notaCredito) => {
    const movimientos = await facturacompraModel.getMovimientosNotaCredito(notaCredito.codigo);
    const otrosImpuestos = await facturacompraModel.getOtrosImpuestosNotaCredito(notaCredito.codigo);
    const formasPago = await facturacompraModel.getFormasPagoNotaCredito(notaCredito.codigo);

    return {
      tipo_documento: 'nota_credito',
      ...notaCredito,
      movimientos,
      otrosImpuestos,
      formasPago
    };
  }));

  const todosLosDocumentos = [...facturasCompletas, ...notasCreditoCompletas]
    .sort((a, b) => parseFecha(b.fecha) - parseFecha(a.fecha));

  return {
    desde,
    hasta,
    total: todosLosDocumentos.length,
    total_facturas: facturasCompletas.length,
    total_notas_credito: notasCreditoCompletas.length,
    documentos: todosLosDocumentos
  };
};

const getFacturasPorServicio = async (idServicio) => {
  return await facturacompraModel.getFacturasPorServicio(idServicio);
};

const getFacturasPendientes = async () => {
  const facturasCompra = await facturacompraModel.getFacturasPendientes();

  const facturasCompletas = await Promise.all(facturasCompra.map(async (factura) => {
    const movimientos = await facturacompraModel.getMovimientosFactura(factura.codigo);
    const otrosImpuestos = await facturacompraModel.getOtrosImpuestosFactura(factura.codigo);
    const formasPago = await facturacompraModel.getFormasPagoFactura(factura.codigo);

    return {
      ...factura,
      movimientos,
      otrosImpuestos,
      formasPago
    };
  }));

  return facturasCompletas;
};

const update = async (codigoFactura, data) => {
  const {
    fecha,
    tipoCmp,
    codigoletra,
    ptoVta,
    NroCmp,
    moneda,
    ctz,
    id_proveedor,
    id_plancompra,
    id_motivo,
    id_servicio,
    id_movil,
    id_responsable,
    id_razonsocial,
    totalIVA21,
    totalIVA27,
    totalIVA10,
    bonificacion,
    periodoiva,
    importe,
    observacion,
    estado,
    item,
    otrosimpuestos,
    formasDePago,
    saldo
  } = data;

  const connection = await facturacompraModel.getConnection();

  try {
    await facturacompraModel.beginTransaction(connection);

    const existeFactura = await facturacompraModel.existeFactura(connection, codigoFactura);
    if (existeFactura.length === 0) {
      throw new Error('Factura no encontrada');
    }

    let idServicioFinal = id_servicio;
    let idMovilFinal = id_movil;

    if (id_motivo !== 'OBR') {
      idServicioFinal = null;
    }

    if (id_movil !== 'VEH' && !id_movil) {
      idMovilFinal = null;
    }

    let saldoFinal = typeof saldo === 'number' && !isNaN(saldo) ? saldo : 0;

    if (formasDePago && formasDePago.length > 0) {
      for (const fp of formasDePago) {
        if ((fp.codigo ?? fp.codigo_valor) === 'CC') {
          saldoFinal = (importe || 0) - (saldo || 0);
        }
      }
    }

    await facturacompraModel.updateFactura(connection, {
      codigoFactura,
      fecha: toMysqlFecha(fecha),
      tipoCmp,
      codigoletra,
      ptoVta,
      NroCmp,
      moneda,
      ctz,
      id_proveedor,
      id_plancompra,
      id_motivo,
      idServicioFinal,
      idMovilFinal,
      id_responsable,
      id_razonsocial,
      totalIVA21,
      totalIVA27,
      totalIVA10,
      bonificacion,
      periodoiva,
      importe,
      observacion,
      estado,
      saldoFinal
    });

    await facturacompraModel.deleteMovimientosFactura(connection, codigoFactura);

    if (item && item.length > 0) {
      const movimientosData = item.map(({
        tipo_operacion, id_articulo, id_concepto, id_herramienta,
        unidad, nombre, cantidad, descuento, precio_final, importe,
        codigo_orden, iva_compras, codigo_remito, cantidad_remitos, saldo
      }) => {
        return [
          codigoFactura,
          tipo_operacion,
          tipo_operacion === 'articulo' ? id_articulo : null,
          tipo_operacion === 'concepto' ? id_concepto : null,
          tipo_operacion === 'herramienta' ? id_herramienta : null,
          unidad,
          nombre,
          cantidad,
          precio_final,
          descuento ?? 0,
          precio_final,
          importe ?? 0,
          codigo_orden || null,
          iva_compras || 0,
          codigo_remito || null,
          1,
          cantidad_remitos || 0.00,
          saldo || 0.00
        ];
      });

      await facturacompraModel.insertFacturaMovimientosUpdate(connection, movimientosData);
    }

    await facturacompraModel.deleteOtrosImpuestosFactura(connection, codigoFactura);

    if (otrosimpuestos && otrosimpuestos.length > 0) {
      const impuestosData = otrosimpuestos.map(({ codigo, codigo_impuesto, valor }) => {
        const codigoImpuesto = codigo ?? codigo_impuesto;
        if (!codigoImpuesto || valor == null) {
          throw new Error(`Datos incompletos para impuesto: ${JSON.stringify({ codigo, valor })}`);
        }
        return [codigoFactura, codigoImpuesto, valor];
      });
      await facturacompraModel.insertOtrosImpuestos(connection, impuestosData);
    }

    await facturacompraModel.deleteFormasPagoFactura(connection, codigoFactura);

    if (formasDePago && formasDePago.length > 0) {
      const formasPagoData = formasDePago.map(({ codigo, codigo_valor, fecha, importe }) => {
        const codigoFormaPago = codigo ?? codigo_valor;
        if (!codigoFormaPago || !fecha || importe === undefined) {
          throw new Error(`Datos incompletos para forma de pago: ${JSON.stringify({ codigo, fecha, importe })}`);
        }
        return [codigoFactura, codigoFormaPago, toMysqlFecha(fecha), importe];
      });

      await facturacompraModel.insertFormasPago(connection, formasPagoData);
    }

    for (const it of item || []) {
      if (it.codigo_orden) {
        await facturacompraModel.insertRemitoOrden(connection, it.codigo_orden, codigoFactura);
      }
    }

    for (const it of item || []) {
      const remito = it?.codigo_remito;
      if (remito) {
        await facturacompraModel.insertRemitoFactura(connection, codigoFactura, remito);
      }
    }

    await facturacompraModel.commit(connection);
    return { codigoFactura, saldoFinal };
  } catch (error) {
    await facturacompraModel.rollback(connection);
    throw error;
  } finally {
    await facturacompraModel.release(connection);
  }
};

const getFacturasSinPeriodoIva = async () => {
  const facturasCompra = await facturacompraModel.getFacturasSinPeriodoIva();

  const facturasCompletas = await Promise.all(facturasCompra.map(async (factura) => {
    const movimientos = await facturacompraModel.getMovimientosFactura(factura.codigo);
    const otrosImpuestos = await facturacompraModel.getOtrosImpuestosFactura(factura.codigo);
    const formasPago = await facturacompraModel.getFormasPagoFactura(factura.codigo);

    return {
      ...factura,
      movimientos,
      otrosImpuestos,
      formasPago
    };
  }));

  return facturasCompletas;
};

const getFacturasPorProveedor = async (idProveedor, idRazonSocial) => {
  const idProveedorNum = Number(idProveedor);
  const idRazonSocialNum = Number(idRazonSocial);

  const facturas = await facturacompraModel.getFacturasPorProveedor(idProveedorNum, idRazonSocialNum);
  const notasCredito = await facturacompraModel.getNotasCreditoPorProveedor(idProveedorNum, idRazonSocialNum);

  return { facturas, notasCredito };
};

const getFacturasPorRazonSocial = async (idRazonSocial) => {
  const facturasCompra = await facturacompraModel.getFacturasPorRazonSocial(idRazonSocial);
  const notasCreditoCompra = await facturacompraModel.getNotasCreditoPorRazonSocial(idRazonSocial);

  const facturasCompletas = await Promise.all(facturasCompra.map(async (factura) => {
    const movimientos = await facturacompraModel.getMovimientosFactura(factura.codigo);
    const otrosImpuestos = await facturacompraModel.getOtrosImpuestosFactura(factura.codigo);
    const formasPago = await facturacompraModel.getFormasPagoFactura(factura.codigo);

    return {
      tipo_documento: 'factura',
      ...factura,
      movimientos,
      otrosImpuestos,
      formasPago
    };
  }));

  const notasCreditoCompletas = await Promise.all(notasCreditoCompra.map(async (notaCredito) => {
    const movimientos = await facturacompraModel.getMovimientosNotaCredito(notaCredito.codigo);
    const otrosImpuestos = await facturacompraModel.getOtrosImpuestosNotaCredito(notaCredito.codigo);
    const formasPago = await facturacompraModel.getFormasPagoNotaCredito(notaCredito.codigo);

    return {
      tipo_documento: 'nota_credito',
      ...notaCredito,
      movimientos,
      otrosImpuestos,
      formasPago
    };
  }));

  const todosLosDocumentos = [...facturasCompletas, ...notasCreditoCompletas]
    .sort((a, b) => parseFecha(a.fecha) - parseFecha(b.fecha));

  return todosLosDocumentos;
};

const filtrarCostos = async (desde, hasta) => {
  if (!desde || !hasta) {
    throw new Error('Faltan las fechas desde y hasta');
  }

  const desdeCompleto = `${desde} 00:00:00`;
  const hastaCompleto = `${hasta} 23:59:59`;

  const connection = await facturacompraModel.getConnection();

  try {
    const facturasCompra = await facturacompraModel.getFacturasCostos(desdeCompleto, hastaCompleto, connection);

    const facturasCompletas = await Promise.all(facturasCompra.map(async (factura) => {
      const movimientos = await facturacompraModel.getMovimientosFactura(factura.codigo);
      const otrosImpuestos = await facturacompraModel.getOtrosImpuestosFactura(factura.codigo);
      const formasPago = await facturacompraModel.getFormasPagoFactura(factura.codigo);

      return {
        tipo: 'factura_compra',
        ...factura,
        movimientos,
        otrosImpuestos,
        formasPago
      };
    }));

    const otrosPagos = await facturacompraModel.getOtrosPagos(desdeCompleto, hastaCompleto, connection);

    const otrosPagosCompletos = await Promise.all(otrosPagos.map(async (pago) => {
      const detalles = await facturacompraModel.getDetallesOtrosPagos(pago.codigo);
      const formasPago = await facturacompraModel.getFormasPagoOtrosPagos(pago.codigo);

      return {
        tipo: 'otro_pago',
        ...pago,
        detalles,
        formasPago
      };
    }));

    const pagosTotales = [...facturasCompletas, ...otrosPagosCompletos];

    return {
      desde,
      hasta,
      total: pagosTotales.length,
      facturas: facturasCompletas.length,
      otrosPagos: otrosPagosCompletos.length,
      pagos: pagosTotales
    };
  } finally {
    await facturacompraModel.release(connection);
  }
};

const filtrarCostosTodos = async (desde, hasta) => {
  if (!desde || !hasta) {
    throw new Error('Faltan las fechas desde y hasta');
  }

  const desdeCompleto = `${desde} 00:00:00`;
  const hastaCompleto = `${hasta} 23:59:59`;

  const connection = await facturacompraModel.getConnection();

  try {
    const facturasCompra = await facturacompraModel.getFacturasCostos(desdeCompleto, hastaCompleto, connection);

    const facturasCompletas = await Promise.all(facturasCompra.map(async (factura) => {
      const movimientos = await facturacompraModel.getMovimientosFactura(factura.codigo);
      const otrosImpuestos = await facturacompraModel.getOtrosImpuestosFactura(factura.codigo);
      const formasPago = await facturacompraModel.getFormasPagoFactura(factura.codigo);

      return {
        tipo: 'factura_compra',
        ...factura,
        movimientos,
        otrosImpuestos,
        formasPago
      };
    }));

    const notasCredito = await facturacompraModel.getNotasCreditoCostos(desdeCompleto, hastaCompleto, connection);

    const notasCreditoCompletas = await Promise.all(notasCredito.map(async (nota) => {
      const movimientos = await facturacompraModel.getMovimientosNotaCredito(nota.codigo);
      const otrosImpuestos = await facturacompraModel.getOtrosImpuestosNotaCredito(nota.codigo);
      const formasPago = await facturacompraModel.getFormasPagoNotaCredito(nota.codigo);

      return {
        tipo: 'nota_credito_compra',
        ...nota,
        movimientos,
        otrosImpuestos,
        formasPago
      };
    }));

    const otrosPagos = await facturacompraModel.getOtrosPagos(desdeCompleto, hastaCompleto, connection);

    const otrosPagosCompletos = await Promise.all(otrosPagos.map(async (pago) => {
      const detalles = await facturacompraModel.getDetallesOtrosPagos(pago.codigo);
      const formasPago = await facturacompraModel.getFormasPagoOtrosPagos(pago.codigo);

      return {
        tipo: 'otro_pago',
        ...pago,
        detalles,
        formasPago
      };
    }));

    const ordenesPago = await facturacompraModel.getOrdenesPago(desdeCompleto, hastaCompleto, connection);

    const ordenesPagoCompletas = await Promise.all(ordenesPago.map(async (orden) => {
      const detalle = await facturacompraModel.getDetalleOrdenPago(orden.codigo);
      const formasPago = await facturacompraModel.getFormasPagoOrdenPago(orden.codigo);
      const otrosImpuestos = await facturacompraModel.getOtrosImpuestosOrdenPago(orden.codigo);

      return {
        tipo: 'orden_pago',
        ...orden,
        detalle,
        formasPago,
        otrosImpuestos
      };
    }));

    const impuestos = await facturacompraModel.getImpuestos(desdeCompleto, hastaCompleto, connection);

    const pagosTotales = [...facturasCompletas, ...notasCreditoCompletas, ...otrosPagosCompletos, ...ordenesPagoCompletas];

    return {
      desde,
      hasta,
      totalPagos: pagosTotales.length,
      totalFacturas: facturasCompletas.length,
      totalNotasCredito: notasCreditoCompletas.length,
      totalOtrosPagos: otrosPagosCompletos.length,
      totalOrdenesPago: ordenesPagoCompletas.length,
      totalImpuestos: impuestos.length,
      pagos: pagosTotales,
      impuestos
    };
  } finally {
    await facturacompraModel.release(connection);
  }
};

const getRelaciones = async (factura) => {
  const rows = await facturacompraModel.getRelaciones(factura);
  if (rows.length === 0) {
    throw new Error('Factura no encontrada en ninguna relación');
  }
  return rows;
};

const crearRelacionOrden = async (data) => {
  const { tipo, codigo, orden_compra } = data;

  if (!tipo || !codigo || !orden_compra) {
    throw new Error('Faltan datos obligatorios.');
  }

  if (tipo !== 'remito' && tipo !== 'factura') {
    throw new Error('Tipo inválido. Debe ser "remito" o "factura".');
  }

  const insertId = await facturacompraModel.insertRelacionOrden(orden_compra, codigo);
  return { tipo, insertId };
};

const crearRelacionFactura = async (data) => {
  const { tipo, codigo, factura } = data;

  if (!tipo || !codigo || !factura) {
    throw new Error('Faltan datos obligatorios.');
  }

  if (tipo !== 'remito' && tipo !== 'orden') {
    throw new Error('Tipo inválido. Debe ser "remito" o "orden".');
  }

  let insertId;
  if (tipo === 'orden') {
    insertId = await facturacompraModel.insertRelacionFacturaOrden(codigo, factura);
  } else {
    insertId = await facturacompraModel.insertRelacionFacturaRemito(codigo, factura);
  }

  return { tipo, insertId };
};

const getIndicadoresFormaPago = async () => {
  const resultado = await facturacompraModel.getIndicadoresFormaPago();
  const totales = await facturacompraModel.getTotalesSaldo();

  return {
    indicadoresPorFormaPago: resultado,
    resumenSaldo: totales
  };
};

const eliminarRelacionFactura = async (data) => {
  const { tipo, codigo, factura } = data;

  if (!tipo || !codigo || !factura) {
    throw new Error('Faltan datos obligatorios.');
  }

  if (tipo !== 'remito' && tipo !== 'orden') {
    throw new Error('Tipo inválido. Debe ser "remito" o "orden".');
  }

  let affectedRows;
  if (tipo === 'orden') {
    affectedRows = await facturacompraModel.deleteRelacionOrdenFactura(codigo, factura);
  } else {
    affectedRows = await facturacompraModel.deleteRelacionRemitoFactura(codigo, factura);
  }

  if (affectedRows === 0) {
    throw new Error('No se encontró la relación para eliminar.');
  }

  return { tipo };
};

const getCostosPorServicio = async (idServicio) => {
  return await facturacompraModel.getCostosPorServicio(idServicio);
};

module.exports = {
  create,
  getAll,
  anular,
  filtrar,
  getFacturasPorServicio,
  getFacturasPendientes,
  update,
  getFacturasSinPeriodoIva,
  getFacturasPorProveedor,
  getFacturasPorRazonSocial,
  filtrarCostos,
  filtrarCostosTodos,
  getRelaciones,
  crearRelacionOrden,
  crearRelacionFactura,
  getIndicadoresFormaPago,
  eliminarRelacionFactura,
  getCostosPorServicio,
};
