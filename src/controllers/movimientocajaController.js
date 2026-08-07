const movimientocajaService = require('../services/movimientocajaService');

const create = async (req, res) => {
  try {
    const codigoCaja = await movimientocajaService.create(req.body);
    res.status(201).json({ message: 'Caja, movimientos y formas de pago registrados con éxito', codigoCaja });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios en la caja.') || error.message.includes('El código generado ya existe')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al registrar caja, movimientos o formas de pago:', error.message || error);
    res.status(500).json({ error: 'Error al registrar caja, movimientos o formas de pago', details: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const cajasConDetalles = await movimientocajaService.getAll();
    res.json(cajasConDetalles);
  } catch (error) {
    console.error('Error al obtener movimientos, formas de pago y facturas de caja:', error.message || error);
    res.status(500).json({
      error: 'Error al obtener movimientos, formas de pago y facturas de caja',
      details: error.message,
    });
  }
};

const getCajaFacturaRegistros = async (req, res) => {
  try {
    const registros = await movimientocajaService.getCajaFacturaRegistros();
    res.json(registros);
  } catch (error) {
    console.error('Error al obtener registros de caja-factura:', error.message || error);
    res.status(500).json({
      error: 'Error al obtener registros de caja-factura',
      details: error.message,
    });
  }
};

const createCajaFactura = async (req, res) => {
  try {
    await movimientocajaService.createCajaFactura(req.body);
    res.status(201).json({ message: 'Registro en caja_factura_compra creado con éxito' });
  } catch (error) {
    if (error.message.includes('son obligatorios.')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('no existe.')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al insertar en caja_factura_compra:', error.message || error);
    res.status(500).json({
      error: 'Error al insertar en caja_factura_compra',
      details: error.message,
    });
  }
};

const getCajaFacturaByCodigo = async (req, res) => {
  const { codigoCaja } = req.params;
  try {
    const registros = await movimientocajaService.getCajaFacturaByCodigo(codigoCaja);
    res.json(registros);
  } catch (error) {
    if (error.message.includes('Se requiere el código de la caja.')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al obtener facturas relacionadas a la caja:', error.message || error);
    res.status(500).json({
      error: 'Error al obtener facturas relacionadas a la caja',
      details: error.message,
    });
  }
};

const deleteCajaFactura = async (req, res) => {
  try {
    await movimientocajaService.deleteCajaFactura(req.body);
    res.json({ message: 'Relación eliminada con éxito' });
  } catch (error) {
    if (error.message.includes('son obligatorios.')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('No existe relación')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al eliminar de caja_factura_compra:', error.message || error);
    res.status(500).json({
      error: 'Error al eliminar de caja_factura_compra',
      details: error.message,
    });
  }
};

const rendirCaja = async (req, res) => {
  try {
    const { codigo_caja, saldo, estado } = req.body;
    await movimientocajaService.rendirCaja(req.body);
    res.json({ message: 'Caja rendida correctamente', codigo_caja, saldo, estado });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios: codigo_caja, saldo, estado')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al rendir caja:', error);
    res.status(500).json({ error: 'Error al rendir caja', details: error.message });
  }
};

const updateCaja = async (req, res) => {
  try {
    const codigoCaja = req.params.codigo;
    const nuevoSaldo = await movimientocajaService.updateCaja(codigoCaja, req.body);
    res.json({ message: 'Caja actualizada con éxito', codigoCaja, nuevoSaldo });
  } catch (error) {
    if (error.message.includes('Caja no encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al actualizar caja:', error.message || error);
    res.status(500).json({ error: 'Error al actualizar caja', details: error.message });
  }
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
