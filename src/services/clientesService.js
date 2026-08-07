const db = require('../../db');
const clientesModel = require('../models/clientesModel');

const getAll = async () => {
  const rows = await clientesModel.getAll();

  const clientes = {};

  rows.forEach(row => {
    if (!clientes[row.CODCLI]) {
      clientes[row.CODCLI] = {
        CODCLI: row.CODCLI,
        DENOMINACION: row.DENOMINACION,
        DIRECCION: row.DIRECCION,
        CUIT: row.CUIT,
        EMAIL: row.email_cliente,
        TELEFONO: row.telefono_cliente,
        IDSITFISCAL: row.IDSITFISCAL,
        situacion_fiscal: row.situacion_fiscal,
        contactos: []
      };
    }

    if (row.id_contacto) {
      clientes[row.CODCLI].contactos.push({
        id_contacto: row.id_contacto,
        nombre: row.nombre_contacto,
        puesto: row.puesto_contacto,
        telefono: row.telefono_contacto,
        email: row.email_contacto
      });
    }
  });

  return Object.values(clientes);
};

const create = async (data) => {
  const { DENOMINACION } = data;

  if (!DENOMINACION) {
    throw new Error('Los campos DENOMINACION, IDSITFISCAL y CUIT son obligatorios');
  }

  const clienteId = await clientesModel.insert(data);
  return clienteId;
};

const getVentasCliente = async (id) => {
  const connection = await db.getConnection();

  try {
    const clientes = await clientesModel.getClienteById(connection, id);
    if (clientes.length === 0) {
      throw new Error('Cliente no encontrado');
    }

    const cliente = clientes[0];

    const servicios = await clientesModel.getServiciosCliente(connection, id);

    const serviciosCompletos = await Promise.all(
      servicios.map(async (servicio) => {
        const presupuestos = await clientesModel.getPresupuestosCliente(connection, id, servicio.id_servicio);

        const presupuestosCompletos = await Promise.all(
          presupuestos.map(async (presupuesto) => {
            const facturas = await clientesModel.getFacturasPresupuesto(connection, presupuesto.codigo);

            const facturasCompletas = await Promise.all(
              facturas.map(async (factura) => {
                const formasPago = await clientesModel.getFormasPagoFactura(connection, factura.codigo);

                let formaPagoPrincipal = 'No Especificado';
                if (formasPago.length > 0) {
                  const primeraFormaPago = formasPago[0].codigo;
                  formaPagoPrincipal =
                    primeraFormaPago === 'CC' ? 'Cuenta Corriente' :
                    primeraFormaPago === 'TR' ? 'Transferencia' :
                    primeraFormaPago === 'EF' ? 'Efectivo' :
                    primeraFormaPago === 'CH' ? 'Cheque' :
                    primeraFormaPago === 'TC' ? 'Tarjeta Crédito' :
                    'No Especificado';
                }

                const recibos = await clientesModel.getRecibosFactura(connection, factura.codigo);

                return {
                  codigo: factura.codigo,
                  numero: factura.numero,
                  fecha: factura.fecha,
                  monto: parseFloat(factura.monto),
                  formaPago: formaPagoPrincipal,
                  formasPagoDetalle: formasPago.map(fp => ({
                    codigo: fp.codigo,
                    descripcion: fp.descripcion,
                    fecha: fp.fecha,
                    monto: parseFloat(fp.monto)
                  })),
                  recibos: recibos.map(r => ({
                    numero: r.numero,
                    fecha: r.fecha,
                    monto: parseFloat(r.monto)
                  }))
                };
              })
            );

            return {
              codigo: presupuesto.codigo,
              numero: presupuesto.numero,
              fecha: presupuesto.fecha,
              saldoIva: parseFloat(presupuesto.saldoIva || 0),
              saldoSinIva: parseFloat(presupuesto.saldoSinIva || 0),
              facturas: facturasCompletas
            };
          })
        );

        return {
          id: servicio.id_servicio,
          name: servicio.name,
          presupuestos: presupuestosCompletos
        };
      })
    );

    return {
      id: cliente.id,
      name: cliente.name,
      rut: cliente.rut,
      services: serviciosCompletos
    };
  } finally {
    connection.release();
  }
};

const getById = async (id) => {
  const rows = await clientesModel.getById(id);

  if (rows.length === 0) {
    throw new Error('Cliente no encontrado');
  }

  const cliente = rows[0];

  return {
    CODCLI: cliente.CODCLI,
    DENOMINACION: cliente.DENOMINACION,
    DIRECCION: cliente.DIRECCION,
    CUIT: cliente.CUIT,
    EMAIL: cliente.email_cliente,
    TELEFONO: cliente.telefono_cliente,
    IDSITFISCAL: cliente.IDSITFISCAL,
    situacion_fiscal: cliente.situacion_fiscal
  };
};

const getEstadosObra = async () => {
  return await clientesModel.getEstadosObra();
};

module.exports = {
  getAll,
  create,
  getVentasCliente,
  getById,
  getEstadosObra,
};
