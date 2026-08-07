const montomovilesModel = require('../models/montomovilesModel');

const getMonto = async (fecha, tipo) => {
  if (!fecha || !tipo) {
    throw new Error('Faltan parámetros: fecha y tipo');
  }

  const date = new Date(fecha);
  if (isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }

  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const año = date.getFullYear();
  const periodo = `${mes}/${año}`;

  const monto = await montomovilesModel.getByPeriodoTipo(periodo, tipo);
  if (!monto) {
    throw new Error('No se encontró monto para ese periodo y tipo');
  }

  return monto;
};

module.exports = {
  getMonto,
};
