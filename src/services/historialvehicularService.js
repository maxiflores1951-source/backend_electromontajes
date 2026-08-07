const db = require('../../db');
const historialvehicularModel = require('../models/historialvehicularModel');

const generarCodigoHistorial = async (connection) => {
  const result = await historialvehicularModel.getLastCodigo(connection);

  const ultimoCodigo = result.length > 0 ? result[0].ultimo : null;
  const parte1 = 'HV00001';

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
    descripcion,
    causa,
    id_movil,
    id_proveedor,
    id_responsable,
    kilometraje,
    horometro,
    observacion,
    respuetos,
    trabajos,
    insumos,
  } = data;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    if (!fecha || !descripcion || !id_movil) {
      throw new Error('Faltan datos obligatorios en el historial vehicular');
    }

    const codigoHistorial = await generarCodigoHistorial(connection);

    let importeTotal = 0;

    if (respuetos?.length > 0) {
      importeTotal += respuetos.reduce(
        (sum, item) => sum + (parseFloat(item.importe) || 0),
        0
      );
    }

    if (trabajos?.length > 0) {
      importeTotal += trabajos.reduce(
        (sum, item) => sum + (parseFloat(item.importe) || 0),
        0
      );
    }

    if (insumos?.length > 0) {
      importeTotal += insumos.reduce(
        (sum, item) => sum + (parseFloat(item.importe) || 0),
        0
      );
    }

    await historialvehicularModel.insertHistorial(connection, [
      codigoHistorial,
      fecha,
      descripcion,
      causa || null,
      id_movil,
      id_proveedor,
      id_responsable || null,
      kilometraje || null,
      horometro || null,
      observacion || null,
      importeTotal,
      idPersonal || null,
    ]);

    if (respuetos?.length > 0) {
      const repuestosData = respuetos.map((item) => {
        if (
          !item.codigo_sec ||
          !item.codigo_item ||
          item.cantidad == null ||
          item.precio == null
        ) {
          throw new Error(
            `Datos incompletos para repuesto: ${JSON.stringify(item)}`
          );
        }

        return [
          codigoHistorial,
          item.codigo_sec,
          item.codigo_item,
          item.descripcion || '',
          item.cantidad,
          item.precio,
          item.importe || (item.cantidad * item.precio),
        ];
      });

      await historialvehicularModel.insertRepuestos(connection, repuestosData);
    }

    if (trabajos?.length > 0) {
      const trabajosData = trabajos.map((item) => {
        if (!item.detalle || item.importe == null) {
          throw new Error(
            `Datos incompletos para trabajo: ${JSON.stringify(item)}`
          );
        }

        return [
          codigoHistorial,
          item.detalle,
          item.importe,
        ];
      });

      await historialvehicularModel.insertTrabajos(connection, trabajosData);
    }

    if (insumos?.length > 0) {
      const insumosData = insumos.map((item) => {
        if (
          !item.nombre ||
          !item.unidad ||
          item.cantidad == null ||
          item.precio == null ||
          item.iva_compras == null
        ) {
          throw new Error(
            `Datos incompletos para insumo: ${JSON.stringify(item)}`
          );
        }

        let tipo_insumo = 'articulo';
        let id_articulo = null;
        let id_concepto = null;

        if (item.codigo && isNaN(item.codigo.charAt(0))) {
          tipo_insumo = 'concepto';
          id_concepto = item.codigo;
        } else {
          id_articulo = item.codigo || null;
        }

        return [
          codigoHistorial,
          tipo_insumo,
          id_articulo,
          id_concepto,
          item.nombre,
          item.unidad,
          item.iva_compras,
          item.cantidad,
          item.precio,
          item.importe || (item.cantidad * item.precio),
          item.asignado || null,
          1,
        ];
      });

      await historialvehicularModel.insertInsumos(connection, insumosData);
    }

    await connection.commit();

    return { codigoHistorial, importeTotal };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAll = async () => {
  const historiales = await historialvehicularModel.getAll();

  const historialesCompletos = await Promise.all(
    historiales.map(async (historial) => {
      const repuestos = await historialvehicularModel.getRepuestosByCodigo(historial.codigo);
      const trabajos = await historialvehicularModel.getTrabajosByCodigo(historial.codigo);
      const insumos = await historialvehicularModel.getInsumosByCodigo(historial.codigo);

      return {
        ...historial,
        repuestos,
        trabajos,
        insumos,
      };
    })
  );

  return historialesCompletos;
};

module.exports = {
  create,
  getAll,
};
