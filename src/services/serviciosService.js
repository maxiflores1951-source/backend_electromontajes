const serviciosModel = require('../models/serviciosModel');

const getAll = async () => {
  return await serviciosModel.getAll();
};

const create = async (data) => {
  const { OBRA, CODCLI, estado_id } = data;

  if (!OBRA || !CODCLI || !estado_id) {
    throw new Error('Faltan datos: OBRA, CODCLI y estado_id son requeridos.');
  }

  const IDOBRA = await serviciosModel.insert(data);

  const obraFinal = `${IDOBRA} - ${OBRA}`;

  await serviciosModel.updateObra(IDOBRA, obraFinal);

  return { IDOBRA, OBRA: obraFinal, estado_id };
};

const getByCliente = async (codcli) => {
  if (!codcli) {
    throw new Error('Se requiere el parámetro codcli');
  }

  return await serviciosModel.getByCliente(codcli);
};

const getEstadosObra = async () => {
  return await serviciosModel.getEstadosObra();
};

const update = async (IDOBRA, data) => {
  const { OBRA, CODCLI, estado_id } = data;

  if (!OBRA || !CODCLI || !estado_id) {
    throw new Error('Faltan datos: OBRA, CODCLI y estado_id son requeridos.');
  }

  const obraFinal = `${IDOBRA} - ${OBRA}`;

  const affected = await serviciosModel.update(IDOBRA, { OBRA: obraFinal, CODCLI, estado_id });
  if (affected === 0) {
    throw new Error('No se encontró el servicio con ese ID.');
  }

  return { IDOBRA, OBRA: obraFinal, CODCLI, estado_id };
};

module.exports = {
  getAll,
  create,
  getByCliente,
  getEstadosObra,
  update,
};
