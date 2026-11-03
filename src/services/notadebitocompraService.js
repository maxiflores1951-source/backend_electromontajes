const notadebitocompraModel = require('../models/notadebitocompraModel');

const normalizarTipoComprobante = (valor) => {
  if (valor === null || valor === undefined || valor === '') return valor;
  return String(valor).trim().padStart(3, '0');
};

const generarCodigoNotaDebito = async (connection) => {
  const [rows] = await connection.query(
    'SELECT MAX(codigo) AS ultimo FROM nota_debito_compra FOR UPDATE'
  );
  const ultimoCodigo = rows[0]?.ultimo;
  const parte1 = 'NDB0001';

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
    throw new Error('Faltan datos obligatorios en la nota de débito de compra');
  }

  const tipoCmpNormalizado = normalizarTipoComprobante(tipoCmp);

  const saldoFinal = typeof saldo === 'number' && !isNaN(saldo) ? saldo : 0;
  const idResponsable = idPersonal || data.id_responsable || null;

  const connection = await notadebitocompraModel.getConnection();
  let codigoNotaDebito;
  let intentos = 0;
  const MAX_INTENTOS = 5;

  try {
    await notadebitocompraModel.beginTransaction(connection);

    while (intentos < MAX_INTENTOS) {
      codigoNotaDebito = await generarCodigoNotaDebito(connection);
      try {
        await notadebitocompraModel.insertNotaDebito(connection, {
          codigoNotaDebito,
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
          saldoFinal,
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

    const notaDebitoInsertada = await notadebitocompraModel.getNotaDebitoByCodigo(connection, codigoNotaDebito);
    if (notaDebitoInsertada.length === 0) {
      throw new Error('Nota de débito recién insertada no encontrada, abortando');
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
          codigoNotaDebito,
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

      await notadebitocompraModel.insertMovimientos(connection, codigoNotaDebito, movimientosData);
    }

    if (otrosimpuestos && otrosimpuestos.length > 0) {
      const impuestosData = otrosimpuestos.map(({ codigo, codigo_impuesto, valor }) => {
        const codigoImpuesto = codigo ?? codigo_impuesto;
        if (!codigoImpuesto || valor === undefined) {
          throw new Error(`Datos incompletos para impuesto: ${JSON.stringify({ codigo, valor })}`);
        }
        return [codigoNotaDebito, codigoImpuesto, valor];
      });

      await notadebitocompraModel.insertOtrosImpuestos(connection, codigoNotaDebito, impuestosData);
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

        return [codigoNotaDebito, codigo_valor, fecha, importe];
      });

      await notadebitocompraModel.insertFormasPago(connection, codigoNotaDebito, formasPagoData);
    }

    if (relacion && Array.isArray(relacion) && relacion.length > 0) {
      for (const codigo of relacion) {
        if (!codigo) continue;

        if (codigo.startsWith('FC')) {
          const facturaExiste = await notadebitocompraModel.getFacturaByCodigo(connection, codigo);
          if (facturaExiste.length === 0) {
            console.warn(`Advertencia: La factura ${codigo} no existe en la base de datos`);
          }
        }
      }
    }

    await notadebitocompraModel.commit(connection);
    return { codigoNotaDebito, id_factura_compra: id_factura_compra || null };
  } catch (error) {
    await notadebitocompraModel.rollback(connection);
    throw error;
  } finally {
    await notadebitocompraModel.release(connection);
  }
};

const getAll = async () => {
  const notasDebito = await notadebitocompraModel.getNotasDebito();

  const notasDebitoCompletas = await Promise.all(
    notasDebito.map(async (notaDebito) => {
      const movimientos = await notadebitocompraModel.getMovimientosNotaDebito(notaDebito.codigo);
      const otrosImpuestos = await notadebitocompraModel.getOtrosImpuestosNotaDebito(notaDebito.codigo);
      const formasPago = await notadebitocompraModel.getFormasPagoNotaDebito(notaDebito.codigo);

      return {
        ...notaDebito,
        movimientos,
        otrosImpuestos,
        formasPago,
      };
    })
  );

  return notasDebitoCompletas;
};

module.exports = {
  create,
  getAll,
};
