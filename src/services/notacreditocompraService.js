const notacreditocompraModel = require('../models/notacreditocompraModel');
const facturacompraModel = require('../models/facturacompraModel');

const normalizarTipoComprobante = (valor) => {
  if (valor === null || valor === undefined || valor === '') return valor;
  return String(valor).trim().padStart(3, '0');
};

const redondear2 = (valor) => {
  const numero = Number(valor);
  if (isNaN(numero)) return 0;
  return Math.round(numero * 100) / 100;
};

const generarCodigoNotaCredito = async (connection) => {
  const [rows] = await connection.query(
    'SELECT MAX(codigo) AS ultimo FROM nota_credito_compra FOR UPDATE'
  );
  const ultimoCodigo = rows[0]?.ultimo;
  const parte1 = 'NCC0001';

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

/**
 * Arma las filas de movimientos_nota_credito_compra a partir de los ítems
 * que llegan del formulario. Se usa tanto en el alta como en la edición.
 */
const mapearMovimientos = (codigoNotaCredito, item) => {
  return item.map(({
    tipo_operacion,
    id_articulo, id_concepto, id_herramienta, id_epp,
    unidad, nombre, cantidad, precio,
    importe, codigo_orden, iva_compras,
    descuento, precio_final, codigo_remito,
    cantidad_remitos, saldo
  }) => {
    if (!nombre || !unidad || cantidad == null || precio_final == null) {
      throw new Error(`Datos incompletos para el item: ${JSON.stringify({ nombre, unidad, cantidad, precio_final })}`);
    }

    return [
      codigoNotaCredito,
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
      cantidad_remitos ?? 0.00,
      saldo ?? 0.00
    ];
  });
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
    relacion,
    id_factura_compra
  } = data;

  if (!fecha || !tipoCmp || !codigoletra || !ptoVta || !NroCmp ||
      !moneda || !id_proveedor || !id_plancompra || !id_motivo ||
      !id_razonsocial || !importe) {
    throw new Error('Faltan datos obligatorios en la nota de crédito de compra');
  }

  const tipoCmpNormalizado = normalizarTipoComprobante(tipoCmp);

  const importeNC = redondear2(importe);
  let saldoFinalNota = typeof saldo === 'number' && !isNaN(saldo) ? redondear2(saldo) : importeNC;
  const idResponsable = idPersonal || data.id_responsable || null;
  let importeAplicado = 0;

  const connection = await notacreditocompraModel.getConnection();
  let codigoNotaCredito;
  let intentos = 0;
  const MAX_INTENTOS = 5;

  try {
    await notacreditocompraModel.ensureDetalleImputacionTable(connection);
    await notacreditocompraModel.beginTransaction(connection);

    if (id_factura_compra) {
      const [facturaRows] = await connection.query(
        'SELECT codigo, saldo, anulada, Estado FROM factura_compra WHERE codigo = ? FOR UPDATE',
        [id_factura_compra]
      );
      if (!facturaRows || facturaRows.length === 0) {
        throw new Error('La factura de compra seleccionada no existe');
      }
      const factura = facturaRows[0];
      if (factura.anulada == 1) {
        throw new Error('No se puede aplicar una nota de crédito a una factura anulada');
      }
      if (importeNC <= 0) {
        throw new Error('El importe de la nota de crédito debe ser mayor a 0');
      }

      const saldoFactura = Number(factura.saldo) || 0;
      // Se aplica a la factura todo lo que pueda cubrir; lo que sobra queda
      // pendiente en la nota de crédito para imputarlo más adelante.
      importeAplicado = redondear2(Math.min(importeNC, saldoFactura));

      if (importeAplicado > 0) {
        const nuevoSaldoFactura = redondear2(saldoFactura - importeAplicado);
        const nuevoEstadoFactura = nuevoSaldoFactura <= 0 ? 'Pagada' : (factura.Estado || factura.estado || 'Completa');
        await facturacompraModel.updateSaldoFacturaCompra(connection, id_factura_compra, nuevoSaldoFactura, nuevoEstadoFactura);
        await connection.query(
          'UPDATE factura_compra SET pagada = IF(saldo <= 0, 1, 0) WHERE codigo = ?',
          [id_factura_compra]
        );
      }

      saldoFinalNota = redondear2(Math.max(0, importeNC - importeAplicado));
    }

    const pagadaFinal = saldoFinalNota <= 0 ? 1 : 0;

    while (intentos < MAX_INTENTOS) {
      codigoNotaCredito = await generarCodigoNotaCredito(connection);
      try {
        await notacreditocompraModel.insertNotaCredito(connection, {
          codigoNotaCredito,
          fecha,
          tipoCmp: tipoCmpNormalizado,
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
          estado: 'Completa',
          saldoFinalNota,
          pagada: pagadaFinal,
          id_factura_compra,
          id_creado: idPersonal || data.id_creado || null
        });
        break;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          intentos++;
          continue;
        }
        throw err;
      }
    }

    if (intentos >= MAX_INTENTOS) {
      throw new Error('No se pudo generar un código único después de varios intentos');
    }

    if (importeAplicado > 0 && id_factura_compra) {
      await notacreditocompraModel.insertDetalleImputacion(
        connection,
        codigoNotaCredito,
        id_factura_compra,
        null,
        importeAplicado
      );
    }

    const notaCreditoInsertada = await notacreditocompraModel.getNotaCreditoByCodigo(connection, codigoNotaCredito);
    if (notaCreditoInsertada.length === 0) {
      throw new Error('Nota de crédito recién insertada no encontrada, abortando');
    }

    if (item && item.length > 0) {
      const movimientosData = mapearMovimientos(codigoNotaCredito, item);

      await notacreditocompraModel.insertMovimientos(connection, codigoNotaCredito, movimientosData);
    }

    if (otrosimpuestos && otrosimpuestos.length > 0) {
      const impuestosData = otrosimpuestos.map(({ codigo, codigo_impuesto, valor }) => {
        const codigoImpuesto = codigo ?? codigo_impuesto;
        if (!codigoImpuesto || valor === undefined) {
          throw new Error(`Datos incompletos para impuesto: ${JSON.stringify({ codigo, valor })}`);
        }
        return [codigoNotaCredito, codigoImpuesto, valor];
      });

      await notacreditocompraModel.insertOtrosImpuestos(connection, codigoNotaCredito, impuestosData);
    }

    if (formasDePago && formasDePago.length > 0) {
      const formasPagoData = formasDePago.map(({ codigo_valor, fecha, importe, saldo }) => {
        if (!codigo_valor || !fecha || importe === undefined) {
          throw new Error(`Datos incompletos para forma de pago: ${JSON.stringify({ codigo_valor, fecha, importe })}`);
        }

        let saldoFinal = saldo ?? 0;
        if (codigo_valor === 'CC') {
          saldoFinal = importe;
        }

        return [codigoNotaCredito, codigo_valor, fecha, importe];
      });

      await notacreditocompraModel.insertFormasPago(connection, codigoNotaCredito, formasPagoData);
    }

    if (relacion && Array.isArray(relacion) && relacion.length > 0) {
      for (const codigo of relacion) {
        if (!codigo) continue;

        if (codigo.startsWith('FC')) {
          const facturaExiste = await notacreditocompraModel.getFacturaByCodigo(connection, codigo);
          if (facturaExiste.length === 0) {
            console.warn(`Advertencia: La factura ${codigo} no existe en la base de datos`);
          }
        }
      }
    }

    await notacreditocompraModel.commit(connection);
    return {
      codigoNotaCredito,
      id_factura_compra: id_factura_compra || null,
      importe_aplicado: importeAplicado,
      saldo_pendiente: redondear2(saldoFinalNota),
    };
  } catch (error) {
    await notacreditocompraModel.rollback(connection);
    throw error;
  } finally {
    await notacreditocompraModel.release(connection);
  }
};

/**
 * Actualiza una nota de crédito de compra existente: cabecera, artículos,
 * otros impuestos y formas de pago.
 *
 * Las imputaciones ya registradas se conservan: el saldo pendiente se
 * recalcula como (importe - lo ya imputado). Si la nota todavía no tiene
 * imputaciones, se puede vincular a una factura de compra aplicando el
 * importe contra su saldo, igual que en el alta.
 */
const update = async (codigo, data, idPersonal) => {
  const {
    fecha, tipoCmp, codigoletra, ptoVta, NroCmp, moneda, ctz,
    id_proveedor, id_plancompra, id_motivo, id_servicio, id_movil,
    id_razonsocial, id_responsable,
    totalIVA21, totalIVA27, totalIVA10,
    bonificacion, periodoiva,
    importe, observacion, estado,
    item, otrosimpuestos, formasDePago,
    id_factura_compra
  } = data;

  if (!codigo) {
    throw new Error('Falta el código de la nota de crédito');
  }
  if (!fecha || !tipoCmp || !codigoletra || !ptoVta || !NroCmp ||
      !moneda || !id_proveedor || !id_plancompra || !id_motivo ||
      !id_razonsocial || !importe) {
    throw new Error('Faltan datos obligatorios en la nota de crédito de compra');
  }

  const tipoCmpNormalizado = normalizarTipoComprobante(tipoCmp);
  const importeNuevo = redondear2(importe);

  const connection = await notacreditocompraModel.getConnection();
  try {
    await notacreditocompraModel.ensureDetalleImputacionTable(connection);
    await notacreditocompraModel.beginTransaction(connection);

    const filas = await notacreditocompraModel.getNotaCreditoRow(connection, codigo);
    if (!filas || filas.length === 0) {
      throw new Error('La nota de crédito no existe');
    }
    const actual = filas[0];
    if (Number(actual.anulada) === 1) {
      throw new Error('La nota de crédito está anulada');
    }

    const imputaciones = await notacreditocompraModel.getImputacionesByNota(connection, codigo);
    const totalImputado = redondear2(
      imputaciones.reduce((sum, imputacion) => sum + (Number(imputacion.importe) || 0), 0)
    );

    const importeViejo = redondear2(actual.importe);
    let saldoFinal;
    let pagadaFinal;
    let importeAplicado = 0;
    let facturaVigente = id_factura_compra || null;

    if (totalImputado > 0) {
      // Hay importes ya aplicados: no se puede bajar del total imputado.
      if (importeNuevo + 0.001 < totalImputado) {
        throw new Error(
          `El importe (${importeNuevo}) no puede ser menor a lo ya imputado (${totalImputado})`
        );
      }
      saldoFinal = redondear2(importeNuevo - totalImputado);
    } else {
      // Sin imputaciones registradas se conserva el estado de pago actual y
      // solo se ajusta por la diferencia del importe. No se tocan los saldos
      // de las facturas: eso se hace desde la imputación.
      const saldoActual = redondear2(actual.saldo);
      saldoFinal = redondear2(Math.max(0, saldoActual + (importeNuevo - importeViejo)));
    }

    pagadaFinal = saldoFinal <= 0 ? 1 : 0;

    await notacreditocompraModel.updateNotaCredito(connection, codigo, {
      fecha,
      tipoCmp: tipoCmpNormalizado,
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
      id_responsable: id_responsable ?? actual.id_responsable ?? null,
      totalIVA21,
      totalIVA27,
      totalIVA10,
      bonificacion,
      importe,
      observacion,
      estado: estado || 'Completa',
      saldoFinalNota: saldoFinal,
      pagada: pagadaFinal,
      id_factura_compra: facturaVigente,
      id_modificado: idPersonal || data.id_modificado || null,
    });

    await notacreditocompraModel.deleteMovimientos(connection, codigo);
    if (item && item.length > 0) {
      const movimientosData = mapearMovimientos(codigo, item);
      await notacreditocompraModel.insertMovimientos(connection, codigo, movimientosData);
    }

    await notacreditocompraModel.deleteOtrosImpuestos(connection, codigo);
    if (otrosimpuestos && otrosimpuestos.length > 0) {
      const impuestosData = otrosimpuestos.map(({ codigo: codigoImp, codigo_impuesto, valor }) => {
        const codigoSeleccionado = codigoImp ?? codigo_impuesto;
        if (!codigoSeleccionado || valor === undefined) {
          throw new Error(`Datos incompletos para impuesto: ${JSON.stringify({ codigo: codigoImp, valor })}`);
        }
        return [codigo, codigoSeleccionado, valor];
      });

      await notacreditocompraModel.insertOtrosImpuestos(connection, codigo, impuestosData);
    }

    await notacreditocompraModel.deleteFormasPago(connection, codigo);
    if (formasDePago && formasDePago.length > 0) {
      const formasPagoData = formasDePago.map(({ codigo_valor, fecha: fechaPago, importe: importePago }) => {
        if (!codigo_valor || !fechaPago || importePago === undefined) {
          throw new Error(
            `Datos incompletos para forma de pago: ${JSON.stringify({ codigo_valor, fecha: fechaPago, importe: importePago })}`
          );
        }
        return [codigo, codigo_valor, fechaPago, importePago];
      });

      await notacreditocompraModel.insertFormasPago(connection, codigo, formasPagoData);
    }

    await notacreditocompraModel.commit(connection);
    return {
      codigoNotaCredito: codigo,
      id_factura_compra: facturaVigente || null,
      importe_aplicado: importeAplicado,
      total_imputado: totalImputado,
      saldo_pendiente: saldoFinal,
    };
  } catch (error) {
    await notacreditocompraModel.rollback(connection);
    throw error;
  } finally {
    await notacreditocompraModel.release(connection);
  }
};

/**
 * Imputa una nota de crédito de compra contra facturas de compra y/o notas
 * de débito. Reduce el saldo de la NC y el de cada comprobante, y guarda la
 * relación en detalle_nota_credito_compra.
 */
const imputar = async (codigo, data) => {
  const detalle = Array.isArray(data?.detalle) ? data.detalle : [];

  if (!codigo) throw new Error('Falta el código de la nota de crédito');
  if (detalle.length === 0) {
    throw new Error('Debe indicar al menos un comprobante para imputar');
  }

  const connection = await notacreditocompraModel.getConnection();

  try {
    await notacreditocompraModel.ensureDetalleImputacionTable(connection);
    await notacreditocompraModel.beginTransaction(connection);

    const [ncRows] = await connection.query(
      'SELECT codigo, saldo, anulada FROM nota_credito_compra WHERE codigo = ? FOR UPDATE',
      [codigo]
    );
    if (ncRows.length === 0) throw new Error('La nota de crédito no existe');
    if (Number(ncRows[0].anulada) === 1) throw new Error('La nota de crédito está anulada');

    let saldoNc = Number(ncRows[0].saldo) || 0;

    const total = detalle.reduce(
      (sum, item) => sum + Math.abs(Number(item.importe) || 0),
      0
    );
    if (total <= 0) throw new Error('El importe a imputar debe ser mayor a cero');
    if (total > saldoNc + 0.001) {
      throw new Error('El importe a imputar supera el saldo de la nota de crédito');
    }

    for (const item of detalle) {
      const importe = Math.abs(Number(item.importe) || 0);
      if (importe <= 0) continue;

      const codigoDoc = String(
        item.codigo_factura_compra ?? item.codigo_notadebito_compra ?? item.codigo ?? ''
      ).trim();
      if (!codigoDoc) throw new Error('Falta el comprobante a imputar');

      const esNotaDebito =
        String(item.tipo ?? '').toUpperCase() === 'ND' || codigoDoc.startsWith('NDB');

      if (esNotaDebito) {
        const [ndRows] = await connection.query(
          'SELECT codigo, saldo FROM nota_debito_compra WHERE codigo = ? FOR UPDATE',
          [codigoDoc]
        );
        if (ndRows.length === 0) throw new Error(`La nota de débito ${codigoDoc} no existe`);

        const saldoNd = Number(ndRows[0].saldo) || 0;
        if (importe > saldoNd + 0.001) {
          throw new Error(`El importe supera el saldo de la nota de débito ${codigoDoc}`);
        }

        const nuevoSaldo = Math.max(0, saldoNd - importe);
        await connection.query(
          'UPDATE nota_debito_compra SET saldo = ?, pagada = IF(? <= 0, 1, 0) WHERE codigo = ?',
          [nuevoSaldo, nuevoSaldo, codigoDoc]
        );
        await notacreditocompraModel.insertDetalleImputacion(
          connection,
          codigo,
          null,
          codigoDoc,
          importe
        );
      } else {
        const [fcRows] = await connection.query(
          'SELECT codigo, saldo, anulada, Estado FROM factura_compra WHERE codigo = ? FOR UPDATE',
          [codigoDoc]
        );
        if (fcRows.length === 0) throw new Error(`La factura ${codigoDoc} no existe`);
        if (Number(fcRows[0].anulada) === 1) {
          throw new Error(`La factura ${codigoDoc} está anulada`);
        }

        const saldoFc = Number(fcRows[0].saldo) || 0;
        if (importe > saldoFc + 0.001) {
          throw new Error(`El importe supera el saldo de la factura ${codigoDoc}`);
        }

        const nuevoSaldo = Math.max(0, saldoFc - importe);
        const nuevoEstado = nuevoSaldo <= 0 ? 'Pagada' : (fcRows[0].Estado || 'Completa');
        await facturacompraModel.updateSaldoFacturaCompra(
          connection,
          codigoDoc,
          nuevoSaldo,
          nuevoEstado
        );
        await connection.query(
          'UPDATE factura_compra SET pagada = IF(saldo <= 0, 1, 0) WHERE codigo = ?',
          [codigoDoc]
        );
        await notacreditocompraModel.insertDetalleImputacion(
          connection,
          codigo,
          codigoDoc,
          null,
          importe
        );
      }
    }

    saldoNc = Math.max(0, saldoNc - total);
    await connection.query(
      'UPDATE nota_credito_compra SET saldo = ?, pagada = IF(? <= 0, 1, 0) WHERE codigo = ?',
      [saldoNc, saldoNc, codigo]
    );

    await notacreditocompraModel.commit(connection);
    return { codigo, saldo_pendiente: saldoNc };
  } catch (error) {
    await notacreditocompraModel.rollback(connection);
    throw error;
  } finally {
    await notacreditocompraModel.release(connection);
  }
};

const getAll = async () => {
  const notasCredito = await notacreditocompraModel.getNotasCredito();

  const notasCreditoCompletas = await Promise.all(
    notasCredito.map(async (notaCredito) => {
      const movimientos = await notacreditocompraModel.getMovimientosNotaCredito(notaCredito.codigo);
      const otrosImpuestos = await notacreditocompraModel.getOtrosImpuestosNotaCredito(notaCredito.codigo);
      const formasPago = await notacreditocompraModel.getFormasPagoNotaCredito(notaCredito.codigo);

      return {
        ...notaCredito,
        movimientos,
        otrosImpuestos,
        formasPago,
      };
    })
  );

  return notasCreditoCompletas;
};

/**
 * Imputaciones de notas de crédito contra facturas de compra / notas de débito.
 * Sirve para saber qué comprobantes ya fueron aplicados y dejarlos visibles
 * en la cuenta corriente aunque su saldo sea 0.
 */
const getImputaciones = async () => {
  return await notacreditocompraModel.getDetalleImputaciones();
};

module.exports = {
  create,
  update,
  imputar,
  getAll,
  getImputaciones,
};
