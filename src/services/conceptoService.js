const conceptoModel = require('../models/conceptoModel');

const getAll = async () => {
  return await conceptoModel.getAll();
};

const getNextCode = async (familyCode) => {
  const row = await conceptoModel.getLastCodeByFamilia(familyCode);

  if (!row) {
    return `${familyCode}001`;
  }

  const lastCode = row.codigo;
  const regex = /^([A-Za-z]+)(\d+)$/;
  const match = lastCode.match(regex);

  if (match && match[1] === familyCode) {
    const lastCodeNumber = parseInt(match[2], 10);
    return `${familyCode}${(lastCodeNumber + 1).toString().padStart(3, '0')}`;
  }

  throw new Error('Formato de código no válido');
};

module.exports = {
  getAll,
  getNextCode,
};
