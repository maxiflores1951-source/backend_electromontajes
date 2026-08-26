const movimientocajaModel = require('../models/movimientocajaModel');
const db = require('../../db');

const generarCodigoCaja = async (connection) => {
  const ultimoCodigo = await movimientocajaModel.getLastCodigo(connection);
  const parte1 = 'CC00001';

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

// Convierte fechas del frontend (dd/MM/yyyy o Date) al formato YYYY-MM-DD que espera MySQL
const toSqlDate = (valor) => {
  if (!valor) return valor;

  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }

  if (typeof valor === 'string') {
    const formatoDia = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (formatoDia) {
      const [, dia, mes, anio] = formatoDia;
      return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
  }

  return valor;
};

// El frontend puede enviar codigo/descripcion o codigo_valor/descripcion_valor
const normalizarFormasDePago = (formasDePago = []) =>
  formasDePago.map(({ codigo, codigo_valor, descripcion, descripcion_valor, fecha, importe }) => ({
    codigo: codigo ?? codigo_valor,
    descripcion: descripcion ?? descripcion_valor,
    fecha,
    importe,
  }));

const create = async (data) => {
  const {
    fecha_pedido,
    id_solicitado,
    id_motivo,
    id_servicio,
    id_movil,
    operacion,
    observacion,
    movimientos,
    importe,
    formasDePago,
    plazo_rendicion,
  } = data;

  if (!fecha_pedido || !id_solicitado || !id_motivo) {
    throw new Error('Faltan datos obligatorios en la caja.');
  }

  const op = (operacion || '').toString().trim().toLowerCase();
  const estado = op === 'egreso' ? 1 : 0;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const codigoCaja = await generarCodigoCaja(connection);

    const existeCaja = await movimientocajaModel.cajaExists(connection, codigoCaja);
    if (existeCaja.length > 0) {
      throw new Error('El código generado ya existe. Intenta nuevamente.');
    }

    await movimientocajaModel.insertCaja(connection, [
      codigoCaja,
      toSqlDate(fecha_pedido),
      id_solicitado,
      id_motivo,
      id_servicio || null,
      id_movil || null,
      operacion || null,
      observacion || null,
      importe || 0,
      estado,
      plazo_rendicion ? 1 : 0,
    ]);

    if (Array.isArray(movimientos) && movimientos.length > 0) {
      const movimientosData = movimientos.map(({ detalle, importe }) => {
        if (!detalle || importe === undefined || importe === null) {
          throw new Error('Datos incompletos en movimientos: detalle e importe son obligatorios.');
        }
        return [detalle, importe, codigoCaja];
      });

      await movimientocajaModel.insertMovimientos(connection, movimientosData);
    }

    if (Array.isArray(formasDePago) && formasDePago.length > 0) {
      const formasData = normalizarFormasDePago(formasDePago).map(({ codigo, descripcion, fecha, importe }) => {
        if (!codigo || !descripcion || !fecha || importe === undefined || importe === null) {
          throw new Error('Datos incompletos en formas de pago: codigo, descripcion, fecha e importe son obligatorios.');
        }
        return [codigoCaja, codigo, descripcion, toSqlDate(fecha), importe];
      });

      await movimientocajaModel.insertFormasPago(connection, formasData);
    }

    await connection.commit();
    return codigoCaja;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAll = async () => {
  const cajas = await movimientocajaModel.getCajas();

  const cajasConDetalles = await Promise.all(
    cajas.map(async (caja) => {
      const movimientos = await movimientocajaModel.getMovimientos(caja.codigo);
      const formasDePago = await movimientocajaModel.getFormasDePago(caja.codigo);
      const facturas = await movimientocajaModel.getFacturasByCaja(caja.codigo);
      return {
        ...caja,
        movimientos,
        formasDePago,
        facturas,
      };
    })
  );

  return cajasConDetalles;
};

const getCajaFacturaRegistros = async () => {
  return await movimientocajaModel.getCajaFacturaRegistros();
};

const createCajaFactura = async (data) => {
  const { codigo_caja, codigo_factura, fecha_aplicacion } = data;

  if (!codigo_caja || !codigo_factura) {
    throw new Error('Los campos codigo_caja y codigo_factura son obligatorios.');
  }

  const caja = await movimientocajaModel.getCajaByCodigo(codigo_caja);
  const factura = await movimientocajaModel.getFacturaByCodigo(codigo_factura);

  if (caja.length === 0) {
    throw new Error('El código de caja no existe.');
  }
  if (factura.length === 0) {
    throw new Error('El código de factura no existe.');
  }

  await movimientocajaModel.insertCajaFactura([codigo_caja, codigo_factura, fecha_aplicacion || new Date()]);
};

const getCajaFacturaByCodigo = async (codigoCaja) => {
  if (!codigoCaja) {
    throw new Error('Se requiere el código de la caja.');
  }
  return await movimientocajaModel.getCajaFacturaByCodigoCaja(codigoCaja);
};

const deleteCajaFactura = async (data) => {
  const { codigo_caja, codigo_factura } = data;

  if (!codigo_caja || !codigo_factura) {
    throw new Error('Los campos codigo_caja y codigo_factura son obligatorios.');
  }

  const relacion = await movimientocajaModel.getCajaFacturaRelacion(codigo_caja, codigo_factura);
  if (relacion.length === 0) {
    throw new Error('No existe relación entre la caja y la factura.');
  }

  await movimientocajaModel.deleteCajaFactura(codigo_caja, codigo_factura);
};

const rendirCaja = async (data) => {
  const { codigo_caja, saldo, estado } = data;

  if (!codigo_caja || saldo === undefined || estado === undefined) {
    throw new Error('Faltan datos obligatorios: codigo_caja, saldo, estado');
  }

  await movimientocajaModel.rendirCaja([saldo, estado, codigo_caja]);
};

const updateCaja = async (codigoCaja, data) => {
  const {
    fecha_pedido,
    id_solicitado,
    id_motivo,
    id_servicio,
    id_movil,
    operacion,
    observacion,
    movimientos,
    importe,
    formasDePago,
    plazo_rendicion,
  } = data;

  const cajaExistente = await movimientocajaModel.getCajaForUpdate(codigoCaja);
  if (!cajaExistente.length) {
    throw new Error('Caja no encontrada');
  }

  const saldoViejo = parseFloat(cajaExistente[0].saldo || 0);
  const importeViejo = parseFloat(cajaExistente[0].importe || 0);

  const importeNuevo = parseFloat(importe);

  const op = (operacion || '').toString().trim().toLowerCase();
  const estadoNuevo = op === 'egreso' ? 1 : 0;

  let nuevoSaldo;
  if (saldoViejo == 0 && estadoNuevo == 1) {
    nuevoSaldo = 0;
  } else {
    nuevoSaldo = saldoViejo - (importeViejo - importeNuevo);
  }

  await movimientocajaModel.updateCaja([
    toSqlDate(fecha_pedido),
    id_solicitado,
    id_motivo,
    id_servicio || null,
    id_movil || null,
    operacion || null,
    observacion || null,
    importeNuevo,
    nuevoSaldo,
    estadoNuevo,
    plazo_rendicion ? 1 : 0,
    codigoCaja,
  ]);

  if (Array.isArray(movimientos)) {
    await movimientocajaModel.deleteMovimientos(codigoCaja);
    if (movimientos.length > 0) {
      const movimientosData = movimientos.map(({ detalle, importe }) => [detalle, importe, codigoCaja]);
      await movimientocajaModel.insertMovimientos(db, movimientosData);
    }
  }

  if (Array.isArray(formasDePago)) {
    await movimientocajaModel.deleteFormasPagoCaja(codigoCaja);
    if (formasDePago.length > 0) {
      const formasData = normalizarFormasDePago(formasDePago).map(({ codigo, descripcion, fecha, importe }) => [codigoCaja, codigo, descripcion, toSqlDate(fecha), importe]);
      await movimientocajaModel.insertFormasPago(db, formasData);
    }
  }

  return nuevoSaldo;
};

module.exports = {
  create,
  getAll,
  getCajaFacturaRegistros,
  createCajaFactura,
  getCajaFacturaByCodigo,
  deleteCajaFactura,
  rendirCaja,
  updateCaja,
};
