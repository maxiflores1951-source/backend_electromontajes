const db = require('../../db');
const notacreditoventaModel = require('../models/notacreditoventaModel');

const generarCodigoNotaCreditoVenta = async (connection) => {
  const result = await notacreditoventaModel.getUltimoCodigo(connection);

  const ultimoCodigo = result.length > 0 ? result[0].ultimo : null;
  const parte1 = 'NCV0001';

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

const redondear2 = (valor) => {
  const numero = Number(valor);
  if (isNaN(numero)) return 0;
  return Math.round(numero * 100) / 100;
};

const create = async (data, idPersonal) => {
  const {
    fecha,
    moneda,
    ctz,
    id_cliente,
    id_razonsocial,
    importe,
    iva21,
    iva27,
    iva105,
    observacion,
    tipoCmp,
    codigoletra,
    ptoVta,
    NroCmp,
    estado,
    saldo,
    detalle,
    codigo_factura_venta,
    otros,
    formasDePago,
  } = data;

  if (
    !fecha || !moneda || !id_cliente || !id_razonsocial ||
    !importe || !tipoCmp || !codigoletra || !ptoVta || !NroCmp
  ) {
    throw new Error('Faltan datos obligatorios');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const periodo_iva = fecha.substring(0, 7);
    const saldoFinal = saldo || importe;

    const codigoNotaCredito = await generarCodigoNotaCreditoVenta(connection);

    await notacreditoventaModel.insert(connection, {
      codigo: codigoNotaCredito,
      fecha,
      periodo_iva,
      moneda,
      ctz,
      id_cliente,
      id_razonsocial,
      importe,
      iva21,
      iva27,
      iva105,
      observacion,
      tipoCmp,
      codigoletra,
      ptoVta,
      NroCmp,
      estado,
      saldo: saldoFinal,
      id_creado: idPersonal,
    });

    let detallesInsertados = 0;
    if (detalle && detalle.length > 0) {
      const detallesData = detalle.map((item) => [
        codigoNotaCredito,
        item.descripcion,
        item.iva || null,
        item.importe,
      ]);

      await notacreditoventaModel.insertDetalles(connection, detallesData);
      detallesInsertados = detalle.length;
    }

    if (otros && otros.length > 0) {
      const otrosImpuestosData = otros.map(({ codigo, nombre, valor }) => [
        codigoNotaCredito,
        codigo,
        nombre,
        valor,
      ]);

      await notacreditoventaModel.insertOtrosImpuestos(connection, otrosImpuestosData);
    }

    if (formasDePago && formasDePago.length > 0) {
      const formasPagoData = formasDePago.map(({ codigo_valor, fecha, importe }) => [
        codigoNotaCredito,
        codigo_valor,
        fecha,
        importe,
      ]);

      await notacreditoventaModel.insertFormasPago(connection, formasPagoData);
    }

    await connection.commit();

    return {
      codigoNotaCredito,
      detallesInsertados,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getByCodigo = async (codigo) => {
  const notaCredito = await notacreditoventaModel.getByCodigo(codigo);

  if (notaCredito.length === 0) {
    throw new Error('Nota de crédito no encontrada');
  }

  const detalles = await notacreditoventaModel.getDetallesByCodigo(codigo);

  return {
    ...notaCredito[0],
    detalles,
  };
};

const getAll = async () => {
  const notasCredito = await notacreditoventaModel.getAll();

  const notasCreditoCompletas = await Promise.all(
    notasCredito.map(async (notaCredito) => {
      const detalle = await notacreditoventaModel.getDetalleCompleto(notaCredito.codigo);
      const otrosImpuestos = await notacreditoventaModel.getOtrosImpuestos(notaCredito.codigo);
      const formasPago = await notacreditoventaModel.getFormasPago(notaCredito.codigo);
      const imputaciones = await notacreditoventaModel.getImputacionesByNota(null, notaCredito.codigo);

      return {
        ...notaCredito,
        detalle,
        otrosImpuestos,
        formasPago,
        imputaciones,
      };
    })
  );

  return notasCreditoCompletas;
};

const getImputaciones = async () => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT i.*, fv.fecha AS fecha_factura, fv.ptoVta AS ptoVta_factura, fv.NroCmp AS nro_factura,
              fv.codigoletra AS letra_factura, fv.importe AS importe_factura,
              fv.id_cliente AS id_cliente_factura, fv.id_razonsocial AS id_razonsocial_factura
       FROM imputacion_nota_venta_factura_venta i
       LEFT JOIN factura_venta fv ON i.codigo_factura_venta = fv.codigo
       ORDER BY i.fecha_creacion DESC`
    );
    return rows;
  } finally {
    connection.release();
  }
};

const update = async (codigo, data, idPersonal) => {
  const {
    fecha,
    moneda,
    ctz,
    id_cliente,
    id_razonsocial,
    importe,
    iva21,
    iva27,
    iva105,
    observacion,
    tipoCmp,
    codigoletra,
    ptoVta,
    NroCmp,
    estado,
    saldo,
    detalle,
    codigo_factura_venta,
    otros,
    formasDePago,
    id_factura_venta,
  } = data;

  if (
    !fecha || !moneda || !id_cliente || !id_razonsocial ||
    !importe || !tipoCmp || !codigoletra || !ptoVta || !NroCmp
  ) {
    throw new Error('Faltan datos obligatorios');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Leer imputaciones existentes de esta NCV
    const imputacionesExistentes = await notacreditoventaModel.getImputacionesByNota(connection, codigo);

    // 2. Revertir saldos de facturas de venta imputadas previamente
    for (const imp of imputacionesExistentes) {
      const montoImp = Number(imp.importe) || 0;
      const [fcRows] = await connection.query(
        'SELECT saldo, estado FROM factura_venta WHERE codigo = ? FOR UPDATE',
        [imp.codigo_factura_venta]
      );
      if (fcRows.length > 0) {
        const saldoActual = Number(fcRows[0].saldo) || 0;
        const nuevoSaldo = redondear2(saldoActual + montoImp);
        const nuevoEstado = nuevoSaldo <= 0 ? 0 : (fcRows[0].estado ?? 0);
        await connection.query(
          'UPDATE factura_venta SET saldo = ?, estado = ? WHERE codigo = ?',
          [nuevoSaldo, nuevoEstado, imp.codigo_factura_venta]
        );
      }
    }

    // 3. Eliminar imputaciones viejas
    await notacreditoventaModel.deleteImputacionesByNota(connection, codigo);

    // 4. Re-aplicar imputaciones con el nuevo importe (proporcional al importe viejo)
    // Si no hay imputaciones previas, usar el id_factura_venta enviado
    const imputacionesAAplicar = imputacionesExistentes.length > 0
      ? imputacionesExistentes.map(imp => ({
          codigo_factura_venta: imp.codigo_factura_venta,
          importe: imp.importe,
        }))
      : (id_factura_venta ? [{ codigo_factura_venta: id_factura_venta, importe }] : []);

    let totalNuevoImputado = 0;
    const importeViejo = Number(importe) || 0;

    if (imputacionesAAplicar.length > 0 && importeViejo > 0) {
      const factor = importeViejo / importeViejo; // factor = 1 si mantenemos montos originales
      // En realidad queremos mantener el monto original de cada imputación si no hay cambio de importe total
      // Si el importe total cambió, redistribuimos proporcionalmente
      const factorRedistribucion = importeViejo > 0 ? importe / importeViejo : 1;

      for (const imp of imputacionesAAplicar) {
        const montoOriginal = Number(imp.importe) || 0;
        const nuevoMonto = redondear2(montoOriginal * factorRedistribucion);

        // Límite: no descontar más del saldo disponible de la factura
        const [fcRows] = await connection.query(
          'SELECT saldo, estado FROM factura_venta WHERE codigo = ? FOR UPDATE',
          [imp.codigo_factura_venta]
        );
        if (fcRows.length > 0) {
          const saldoActual = Number(fcRows[0].saldo) || 0;
          const montoAplicar = Math.min(nuevoMonto, saldoActual);
          const nuevoSaldo = redondear2(saldoActual - montoAplicar);
          const nuevoEstado = nuevoSaldo <= 0 ? 0 : (fcRows[0].estado ?? 0);
          await connection.query(
            'UPDATE factura_venta SET saldo = ?, estado = ? WHERE codigo = ?',
            [nuevoSaldo, nuevoEstado, imp.codigo_factura_venta]
          );

          await notacreditoventaModel.insertImputacion(
            connection,
            codigo,
            imp.codigo_factura_venta,
            montoAplicar
          );
          totalNuevoImputado += montoAplicar;
        }
      }
    } else if (id_factura_venta) {
      // Nueva imputación contra una factura específica
      const [fcRows] = await connection.query(
        'SELECT saldo, estado FROM factura_venta WHERE codigo = ? FOR UPDATE',
        [id_factura_venta]
      );
      if (fcRows.length > 0) {
        const saldoActual = Number(fcRows[0].saldo) || 0;
        const montoAplicar = Math.min(importeViejo, saldoActual);
        const nuevoSaldo = redondear2(saldoActual - montoAplicar);
        const nuevoEstado = nuevoSaldo <= 0 ? 0 : (fcRows[0].estado ?? 0);
        await connection.query(
          'UPDATE factura_venta SET saldo = ?, estado = ? WHERE codigo = ?',
          [nuevoSaldo, nuevoEstado, id_factura_venta]
        );

        await notacreditoventaModel.insertImputacion(
          connection,
          codigo,
          id_factura_venta,
          montoAplicar
        );
        totalNuevoImputado += montoAplicar;
      }
    }

    // 5. Saldo final de la nota de crédito de venta
    const saldoFinal = redondear2(Math.max(0, importeViejo - totalNuevoImputado));

    // 6. Actualizar la nota de crédito
    const [rows] = await connection.query(
      `UPDATE nota_credito_venta SET
        fecha = ?, moneda = ?, ctz = ?, id_cliente = ?, id_razonsocial = ?,
        importe = ?, iva21 = ?, iva27 = ?, iva105 = ?, observacion = ?,
        tipoCmp = ?, codigoletra = ?, ptoVta = ?, NroCmp = ?, estado = ?,
        saldo = ?, id_modificado = ?, fecha_modificacion = ?
      WHERE codigo = ?`,
      [
        fecha,
        moneda,
        ctz || 1,
        id_cliente,
        id_razonsocial,
        importe,
        iva21 || 0,
        iva27 || 0,
        iva105 || 0,
        observacion || null,
        tipoCmp,
        codigoletra,
        ptoVta,
        NroCmp,
        estado || 0,
        saldoFinal,
        idPersonal || null,
        new Date().toISOString().slice(0, 19).replace('T', ' '),
        codigo,
      ]
    );

    await connection.commit();

    return {
      codigo,
      saldo_final: saldoFinal,
      total_imputado: redondear2(totalNuevoImputado),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const imputar = async (codigo, data) => {
  const detalle = Array.isArray(data?.detalle) ? data.detalle : [];

  if (!codigo) throw new Error('Falta el código de la nota de crédito');
  if (detalle.length === 0) {
    throw new Error('Debe indicar al menos una factura para imputar');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verificar que la NCV exista
    const [ncRows] = await connection.query(
      'SELECT codigo, saldo, importe FROM nota_credito_venta WHERE codigo = ? FOR UPDATE',
      [codigo]
    );
    if (ncRows.length === 0) throw new Error('La nota de crédito no existe');

    const saldoNc = Number(ncRows[0].saldo) || 0;

    const total = detalle.reduce(
      (sum, item) => sum + Math.abs(Number(item.importe) || 0),
      0
    );
    if (total <= 0) throw new Error('El importe a imputar debe ser mayor a cero');
    if (total > saldoNc + 0.001) {
      throw new Error('El importe a imputar supera el saldo de la nota de crédito');
    }

    let totalAplicado = 0;

    for (const item of detalle) {
      const importe = Math.abs(Number(item.importe) || 0);
      if (importe <= 0) continue;

      const codigoFactura = String(item.codigo_factura_venta || item.codigo || '').trim();
      if (!codigoFactura) throw new Error('Falta el código de factura de venta');

      const [fcRows] = await connection.query(
        'SELECT saldo, estado FROM factura_venta WHERE codigo = ? FOR UPDATE',
        [codigoFactura]
      );
      if (fcRows.length === 0) throw new Error(`La factura ${codigoFactura} no existe`);

      const saldoFactura = Number(fcRows[0].saldo) || 0;
      const montoAplicar = Math.min(importe, saldoFactura);

      if (montoAplicar > 0) {
        const nuevoSaldo = redondear2(saldoFactura - montoAplicar);
        const nuevoEstado = nuevoSaldo <= 0 ? 0 : (fcRows[0].estado ?? 0);
        await connection.query(
          'UPDATE factura_venta SET saldo = ?, estado = ? WHERE codigo = ?',
          [nuevoSaldo, nuevoEstado, codigoFactura]
        );

        await notacreditoventaModel.insertImputacion(
          connection,
          codigo,
          codigoFactura,
          montoAplicar
        );
        totalAplicado += montoAplicar;
      }
    }

    const nuevoSaldoNc = redondear2(saldoNc - totalAplicado);
    await connection.query(
      'UPDATE nota_credito_venta SET saldo = ? WHERE codigo = ?',
      [nuevoSaldoNc, codigo]
    );

    await connection.commit();
    return { codigo, saldo_pendiente: nuevoSaldoNc, total_imputado: totalAplicado };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  create,
  getByCodigo,
  getAll,
  update,
  imputar,
  getImputaciones,
};
