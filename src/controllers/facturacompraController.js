const facturacompraService = require('../services/facturacompraService');

const create = async (req, res) => {
  try {
    const codigoFactura = await facturacompraService.create(req.body, req.idPersonal);
    res.status(201).json({ mensaje: 'Factura creada correctamente', codigoFactura });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios') || error.message.includes('Datos incompletos') || error.message.includes('obligatorio para EPP')) {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la factura', detalle: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const facturasCompletas = await facturacompraService.getAll();
    res.json(facturasCompletas);
  } catch (error) {
    console.error('Error al obtener las facturas de compra:', error);
    res.status(500).json({
      error: 'Error al obtener las facturas de compra',
      details: error.message
    });
  }
};

const anular = async (req, res) => {
  const { codigo } = req.params;
  try {
    await facturacompraService.anular(codigo);
    res.json({ message: 'Factura anulada correctamente' });
  } catch (error) {
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al anular la factura:', error);
    res.status(500).json({
      error: 'Error al anular la factura',
      details: error.message
    });
  }
};

const filtrar = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Faltan las fechas desde y hasta' });
    }
    const resultado = await facturacompraService.filtrar(desde, hasta);
    res.json(resultado);
  } catch (error) {
    console.error('Error al filtrar documentos de compra:', error);
    res.status(500).json({ error: 'Error del servidor al filtrar documentos de compra' });
  }
};

const getFacturasPorServicio = async (req, res) => {
  const { idServicio } = req.params;
  try {
    const facturas = await facturacompraService.getFacturasPorServicio(idServicio);
    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas por servicio:', error);
    res.status(500).json({ error: 'Error al obtener facturas por servicio' });
  }
};

const getFacturasPendientes = async (req, res) => {
  try {
    const facturasCompletas = await facturacompraService.getFacturasPendientes();
    res.json(facturasCompletas);
  } catch (error) {
    console.error('Error al obtener las facturas de compra:', error);
    res.status(500).json({
      error: 'Error al obtener las facturas de compra',
      details: error.message
    });
  }
};

const update = async (req, res) => {
  const codigoFactura = req.params.codigo;
  try {
    const { codigoFactura: codigo, saldoFinal } = await facturacompraService.update(codigoFactura, req.body);
    res.status(200).json({ mensaje: 'Factura actualizada correctamente', codigoFactura: codigo, saldoFinal });
  } catch (error) {
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Datos incompletos')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al actualizar factura:', error);
    res.status(500).json({ error: 'Error al actualizar la factura', detalles: error.message });
  }
};

const getFacturasSinPeriodoIva = async (req, res) => {
  try {
    const facturasCompletas = await facturacompraService.getFacturasSinPeriodoIva();
    res.json(facturasCompletas);
  } catch (error) {
    console.error('Error al obtener las facturas con periodoiva NULL:', error);
    res.status(500).json({
      error: 'Error al obtener las facturas con periodoiva NULL',
      details: error.message
    });
  }
};

const getFacturasPorProveedor = async (req, res) => {
  const idProveedor = req.query.id_proveedor;
  const idRazonSocial = req.query.id_razon_social;
  try {
    const resultado = await facturacompraService.getFacturasPorProveedor(idProveedor, idRazonSocial);
    res.json(resultado);
  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({
      error: 'Error al obtener comprobantes',
      details: error.message
    });
  }
};

const getFacturasPorRazonSocial = async (req, res) => {
  const idRazonSocial = req.params.id;
  try {
    const todosLosDocumentos = await facturacompraService.getFacturasPorRazonSocial(idRazonSocial);
    res.json(todosLosDocumentos);
  } catch (error) {
    console.error('Error al obtener los documentos por razón social:', error);
    res.status(500).json({
      error: 'Error al obtener los documentos por razón social',
      details: error.message
    });
  }
};

const filtrarCostos = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Faltan las fechas desde y hasta' });
    }
    const resultado = await facturacompraService.filtrarCostos(desde, hasta);
    res.json(resultado);
  } catch (error) {
    console.error('Error al filtrar pagos:', error);
    res.status(500).json({ error: 'Error del servidor al filtrar pagos' });
  }
};

const filtrarCostosTodos = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Faltan las fechas desde y hasta' });
    }
    const resultado = await facturacompraService.filtrarCostosTodos(desde, hasta);
    res.json(resultado);
  } catch (error) {
    console.error('Error al filtrar pagos completos:', error);
    res.status(500).json({ error: 'Error del servidor al filtrar pagos completos' });
  }
};

const getRelaciones = async (req, res) => {
  const { factura } = req.params;
  try {
    const rows = await facturacompraService.getRelaciones(factura);
    res.json(rows);
  } catch (error) {
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error al obtener relaciones de la factura:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const crearRelacionOrden = async (req, res) => {
  try {
    const { tipo, insertId } = await facturacompraService.crearRelacionOrden(req.body);
    res.json({ message: `Relación de ${tipo} creada correctamente.`, id: insertId });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios') || error.message.includes('Tipo inválido')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creando relación:', error);
    res.status(500).json({ error: 'Error al crear la relación.' });
  }
};

const crearRelacionFactura = async (req, res) => {
  try {
    const { tipo, insertId } = await facturacompraService.crearRelacionFactura(req.body);
    res.json({ message: `Relación ${tipo} → factura creada correctamente.`, id: insertId });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios') || error.message.includes('Tipo inválido')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creando relación con factura:', error);
    res.status(500).json({ error: 'Error al crear la relación con factura.' });
  }
};

const getIndicadoresFormaPago = async (req, res) => {
  try {
    const resultado = await facturacompraService.getIndicadoresFormaPago();
    res.json(resultado);
  } catch (error) {
    console.error('Error obteniendo indicadores de forma de pago:', error);
    res.status(500).json({ error: 'Error al obtener indicadores', detalles: error.message });
  }
};

const eliminarRelacionFactura = async (req, res) => {
  try {
    const { tipo } = await facturacompraService.eliminarRelacionFactura(req.body);
    res.json({ message: `Relación ${tipo} → factura eliminada correctamente.` });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios') || error.message.includes('Tipo inválido')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('No se encontró')) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error eliminando relación con factura:', error);
    res.status(500).json({ error: 'Error al eliminar la relación con factura.' });
  }
};

const getCostosPorServicio = async (req, res) => {
  const { idServicio } = req.params;
  try {
    const result = await facturacompraService.getCostosPorServicio(idServicio);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener costos por servicio:', error);
    res.status(500).json({ error: 'Error al obtener costos por servicio', details: error.message });
  }
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
