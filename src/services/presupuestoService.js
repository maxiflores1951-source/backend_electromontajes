const presupuestoModel = require('../models/presupuestoModel');

const generarCodigoPresupuesto = async (connection) => {
  const [rows] = await connection.query(
    'SELECT MAX(codigo) AS ultimo FROM presupuesto FOR UPDATE'
  );
  const ultimoCodigo = rows[0]?.ultimo;
  const parte1 = 'X00001';

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

const create = async (data) => {
  const {
    fecha,
    fecha_entrega,
    condicion_pago,
    moneda,
    ctz,
    id_servicio,
    id_cliente,
    id_contacto,
    id_razonsocial,
    importe,
    importe_sin_iva,
    iva21,
    observacion,
    validez_oferta,
    condiciones_oferta,
    detalle,
    denominacion,
    tipo_presupuesto,
    estado
  } = data;

  if (!fecha || !moneda || !id_cliente || !id_razonsocial || !importe) {
    throw new Error('Faltan datos obligatorios en el presupuesto');
  }

  const connection = await presupuestoModel.getConnection();
  let codigoPresupuesto;
  let intentos = 0;
  const MAX_INTENTOS = 5;

  try {
    await presupuestoModel.beginTransaction(connection);

    while (intentos < MAX_INTENTOS) {
      codigoPresupuesto = await generarCodigoPresupuesto(connection);
      try {
        await presupuestoModel.insertPresupuesto(connection, {
          codigoPresupuesto,
          fecha,
          fecha_entrega,
          condicion_pago,
          moneda,
          ctz,
          id_servicio,
          id_cliente,
          id_contacto,
          id_razonsocial,
          importe,
          importe_sin_iva,
          iva21,
          observacion,
          validez_oferta,
          condiciones_oferta,
          estado,
          denominacion,
          tipo_presupuesto
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

    if (detalle && detalle.length > 0) {
      const detalleData = detalle.map(({ item, descripcion, cantidad, precio_unitario, importe }) => [
        codigoPresupuesto,
        item,
        descripcion,
        cantidad,
        precio_unitario,
        importe
      ]);

      await presupuestoModel.insertDetalle(connection, detalleData);
    }

    await presupuestoModel.commit(connection);
    return codigoPresupuesto;
  } catch (error) {
    await presupuestoModel.rollback(connection);
    throw error;
  } finally {
    await presupuestoModel.release(connection);
  }
};

const getAll = async () => {
  const presupuestos = await presupuestoModel.getPresupuestos();

  const presupuestosCompletos = await Promise.all(
    presupuestos.map(async (presupuesto) => {
      const detalle = await presupuestoModel.getDetallePresupuesto(presupuesto.codigo);

      return {
        ...presupuesto,
        detalle
      };
    })
  );

  return presupuestosCompletos;
};

const getFacturar = async (id_cliente, id_servicio) => {
  const presupuestos = await presupuestoModel.getPresupuestosFacturar({ id_cliente, id_servicio });

  const presupuestosCompletos = await Promise.all(
    presupuestos.map(async (presupuesto) => {
      const detalle = await presupuestoModel.getDetallePresupuesto(presupuesto.codigo);

      return {
        ...presupuesto,
        detalle
      };
    })
  );

  return presupuestosCompletos;
};

const getActivos = async (id_cliente) => {
  const presupuestos = await presupuestoModel.getPresupuestosActivos(id_cliente);

  const presupuestosCompletos = await Promise.all(
    presupuestos.map(async (presupuesto) => {
      const detalle = await presupuestoModel.getDetallePresupuesto(presupuesto.codigo);
      return { ...presupuesto, detalle };
    })
  );

  return presupuestosCompletos;
};

const getConFacturas = async () => {
  const presupuestos = await presupuestoModel.getPresupuestosConFacturas();

  const presupuestosCompletos = await Promise.all(
    presupuestos.map(async (presupuesto) => {
      const detalle = await presupuestoModel.getDetallePresupuesto(presupuesto.codigo);
      const facturas = await presupuestoModel.getFacturasPresupuesto(presupuesto.codigo);

      return {
        ...presupuesto,
        detalle,
        facturas
      };
    })
  );

  return presupuestosCompletos;
};

const getByCodigo = async (codigo) => {
  const presupuesto = await presupuestoModel.getPresupuestoByCodigo(codigo);

  if (!presupuesto) {
    const error = new Error('Presupuesto no encontrado');
    error.status = 404;
    throw error;
  }

  const detalle = await presupuestoModel.getDetallePresupuesto(codigo);

  return {
    ...presupuesto,
    detalle
  };
};

const update = async (codigo, data) => {
  const { detalle, ...presupuestoData } = data;

  const connection = await presupuestoModel.getConnection();

  try {
    await presupuestoModel.beginTransaction(connection);

    await presupuestoModel.updatePresupuesto(connection, codigo, presupuestoData);

    if (detalle && detalle.length > 0) {
      await presupuestoModel.deleteDetalle(connection, codigo);

      const detalleData = detalle.map(({ item, descripcion, cantidad, precio_unitario, importe }) => [
        codigo, item, descripcion, cantidad, precio_unitario, importe
      ]);

      await presupuestoModel.insertDetalle(connection, detalleData);
    }

    await presupuestoModel.commit(connection);
    return codigo;
  } catch (error) {
    await presupuestoModel.rollback(connection);
    throw error;
  } finally {
    await presupuestoModel.release(connection);
  }
};

module.exports = {
  create,
  getAll,
  getFacturar,
  getActivos,
  getConFacturas,
  getByCodigo,
  update,
};
