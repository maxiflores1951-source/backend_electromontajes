const estadocuentaClienteService = require('../services/estadocuenta_clienteService');

const getPresupuestosCompleto = async (req, res) => {
  try {
    const resultado = await estadocuentaClienteService.getPresupuestosCompleto(req.params.id);
    res.status(200).json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Error al obtener datos completos del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la información',
      error: error.message,
    });
  }
};

const getResumenServicios = async (req, res) => {
  try {
    const data = await estadocuentaClienteService.getResumenServicios(req.params.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error al obtener resumen por servicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen',
      error: error.message,
    });
  }
};

module.exports = {
  getPresupuestosCompleto,
  getResumenServicios,
};
