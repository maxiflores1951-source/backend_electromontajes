const reporteModel = require('../models/reporteModel');

const getFormasPago = async (desde, hasta) => {
  if (!desde || !hasta) {
    throw new Error('Faltan las fechas desde y hasta');
  }

  const desdeCompleto = `${desde} 00:00:00`;
  const hastaCompleto = `${hasta} 23:59:59`;

  return await reporteModel.getFormasPago(desdeCompleto, hastaCompleto);
};

module.exports = {
  getFormasPago,
};
