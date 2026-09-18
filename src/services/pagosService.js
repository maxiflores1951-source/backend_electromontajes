const pagosModel = require('../models/pagosModel');
const db = require('../../db');

const generarCodigoOrdenPago = async (connection) => {
  const [rows] = await connection.query(
    'SELECT MAX(codigo) AS ultimo FROM orden_pago FOR UPDATE'
  );
  const ultimoCodigo = rows[0]?.ultimo;
  const parte1 = 'OP00001';

  if (!ultimoCodigo) {
    return `${parte1}-00000001`;
  }

  const numero = parseInt(ultimoCodigo.split('-')[1], 10) + 1;
  return `${parte1}-${numero.toString().padStart(8, '0')}`;
};

const validarDatos = async (data) => {
  const { detalle, otrosimpuestos, formasDePago } = data;

  if (Array.isArray(detalle)) {
    for (const item of detalle) {
      const codigo = item.codigo_factura_compra;
      const esNotaCredito = codigo.startsWith('NCC');
      const table = esNotaCredito ? 'nota_credito_compra' : 'factura_compra';
      const [rows] = await db.query(`SELECT 1 FROM ${table} WHERE codigo = ?`, [codigo]);
      if (rows.length === 0) {
        throw new Error(`El código ${codigo} no existe en ${table}`);
      }
    }
  }

  if (Array.isArray(otrosimpuestos)) {
    for (const imp of otrosimpuestos) {
      const [rows] = await db.query('SELECT 1 FROM otros_impuestos WHERE codigo = ?', [imp.codigo_impuesto]);
      if (rows.length === 0) {
        throw new Error(`El impuesto ${imp.codigo_impuesto} no existe`);
      }
    }
  }

  if (Array.isArray(formasDePago)) {
    for (const fp of formasDePago) {
      const [rows] = await db.query('SELECT 1 FROM valores WHERE codigo = ?', [fp.codigo_valor]);
      if (rows.length === 0) {
        throw new Error(`La forma de pago ${fp.codigo_valor} no existe`);
      }
    }
  }
};

const create = async (data, idUsuario) => {
  const {
    fecha,
    moneda,
    ctz,
    id_proveedor,
    id_razonsocial,
    importe,
    detalle,
    otrosimpuestos,
    formasDePago,
  } = data;

  if (!fecha || !moneda || !id_proveedor || !id_razonsocial || !importe) {
    throw new Error('Faltan datos obligatorios en la orden de pago');
  }

  await validarDatos(data);

  const connection = await db.getConnection();
  let codigoOrdenPago;
  let intentos = 0;
  const MAX_INTENTOS = 5;

  try {
    await connection.beginTransaction();

    while (intentos < MAX_INTENTOS) {
      codigoOrdenPago = await generarCodigoOrdenPago(connection);
      try {
        await pagosModel.insertOrdenPago(connection, [
          codigoOrdenPago,
          fecha,
          moneda,
          ctz || 1,
          id_proveedor,
          id_razonsocial,
          importe,
          idUsuario || null,
        ]);
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

    if (Array.isArray(detalle) && detalle.length > 0) {
      for (const item of detalle) {
        const codigo = item.codigo_factura_compra;
        const importeNum = Number(item.importe);
        const esNotaCredito = codigo.startsWith('NCC');

        await pagosModel.insertDetalleOrdenPago(connection, [
          codigoOrdenPago,
          esNotaCredito ? null : codigo,
          esNotaCredito ? codigo : null,
          importeNum,
        ]);

        if (esNotaCredito) {
          await pagosModel.updateSaldoNotaCredito(connection, importeNum, codigo);
        } else {
          await pagosModel.updateSaldoFactura(connection, importeNum, codigo);
        }
      }
    }

    if (otrosimpuestos?.length) {
      const data = otrosimpuestos.map(i => [
        codigoOrdenPago,
        i.codigo_impuesto,
        i.valor,
      ]);
      await pagosModel.insertOtrosImpuestos(connection, data);
    }

    if (formasDePago?.length) {
      const pagos = formasDePago.map(p => [
        codigoOrdenPago,
        p.codigo_valor,
        p.fecha,
        p.importe,
      ]);
      await pagosModel.insertFormasPago(connection, pagos);
    }

    await connection.commit();
    return codigoOrdenPago;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAll = async () => {
  const connection = await db.getConnection();
  try {
    const ordenesPago = await pagosModel.getOrdenesPago(connection);

    for (const ordenPago of ordenesPago) {
      ordenPago.facturas_compra = await pagosModel.getFacturasByOrdenPago(connection, ordenPago.codigo);
      ordenPago.notas_credito_compra = await pagosModel.getNotasCreditoByOrdenPago(connection, ordenPago.codigo);
      ordenPago.otros_impuestos = await pagosModel.getImpuestosByOrdenPago(connection, ordenPago.codigo);
      ordenPago.formas_pago = await pagosModel.getFormasPagoByOrdenPago(connection, ordenPago.codigo);
    }

    return ordenesPago;
  } finally {
    connection.release();
  }
};

const getByProveedor = async (idProveedor, idRazonSocial) => {
  const ordenesPago = await pagosModel.getOrdenesPagoByProveedor(idProveedor, idRazonSocial);

  const pagosCompletos = await Promise.all(
    ordenesPago.map(async (pago) => {
      const facturas = await pagosModel.getFacturasByPago(pago.codigo);
      const impuestos = await pagosModel.getImpuestosByPago(pago.codigo);
      const formasPago = await pagosModel.getFormasPagoByPago(pago.codigo);
      return {
        ...pago,
        facturas,
        impuestos,
        formasPago,
      };
    })
  );

  return pagosCompletos;
};

module.exports = {
  create,
  getAll,
  getByProveedor,
};
