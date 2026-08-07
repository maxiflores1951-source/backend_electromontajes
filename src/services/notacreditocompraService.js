const notacreditocompraModel = require('../models/notacreditocompraModel');

const generarCodigoNotaCredito = async (connection) => {
  const ultimoCodigo = await notacreditocompraModel.getLastCodigo(connection);
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

  const saldoFinal = typeof saldo === 'number' && !isNaN(saldo) ? saldo : 0;
  const idResponsable = idPersonal || data.id_responsable || null;

  const connection = await notacreditocompraModel.getConnection();

  try {
    await notacreditocompraModel.beginTransaction(connection);

    const codigoNotaCredito = await generarCodigoNotaCredito(connection);

    await notacreditocompraModel.insertNotaCredito(connection, {
      codigoNotaCredito,
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
      saldoFinal,
      id_factura_compra
    });

    const notaCreditoInsertada = await notacreditocompraModel.getNotaCreditoByCodigo(connection, codigoNotaCredito);
    if (notaCreditoInsertada.length === 0) {
      throw new Error('Nota de crédito recién insertada no encontrada, abortando');
    }

    if (item && item.length > 0) {
      const movimientosData = item.map(({
        tipo_operacion,
        id_articulo, id_concepto, id_herramienta, id_epp,
        unidad, nombre, cantidad, precio,
        importe, codigo_orden, iva_compras,
        descuento, precio_final, codigo_remito,
        cantidad_remitos, saldo
      }) => {
        if (!nombre || !unidad || !cantidad || !precio) {
          throw new Error(`Datos incompletos para el item: ${JSON.stringify({ nombre, unidad, cantidad, precio })}`);
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
          precio,
          descuento ?? 0,
          precio_final ?? 0,
          importe ?? 0,
          codigo_orden ?? null,
          iva_compras ?? 0,
          codigo_remito ?? null,
          1,
          cantidad_remitos ?? 0.00,
          saldo ?? 0.00
        ];
      });

      await notacreditocompraModel.insertMovimientos(connection, codigoNotaCredito, movimientosData);
    }

    if (otrosimpuestos && otrosimpuestos.length > 0) {
      const impuestosData = otrosimpuestos.map(({ codigo, valor }) => {
        if (!codigo || valor === undefined) {
          throw new Error(`Datos incompletos para impuesto: ${JSON.stringify({ codigo, valor })}`);
        }
        return [codigoNotaCredito, codigo, valor];
      });

      await notacreditocompraModel.insertOtrosImpuestos(connection, codigoNotaCredito, impuestosData);
    }

    if (formasDePago && formasDePago.length > 0) {
      const formasPagoData = formasDePago.map(({ codigo, fecha, importe, saldo }) => {
        if (!codigo || !fecha || importe === undefined) {
          throw new Error(`Datos incompletos para forma de pago: ${JSON.stringify({ codigo, fecha, importe })}`);
        }

        let saldoFinal = saldo ?? 0;
        if (codigo === 'CC') {
          saldoFinal = importe;
        }

        return [codigoNotaCredito, codigo, fecha, importe];
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
    return { codigoNotaCredito, id_factura_compra: id_factura_compra || null };
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

module.exports = {
  create,
  getAll,
};
