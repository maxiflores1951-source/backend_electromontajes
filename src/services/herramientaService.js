const herramientaModel = require('../models/herramientaModel');

const getAll = async (estado) => {
  return await herramientaModel.getAll(estado);
};

const getDisponibles = async () => {
  return await herramientaModel.getDisponibles();
};

const getNextCode = async (familyCode) => {
  if (!familyCode) throw new Error('Código de familia requerido');
  const results = await herramientaModel.getNextCode(familyCode);
  if (results.length === 0) {
    // Si no hay resultados, es la primera herramienta de esa familia
    return `${familyCode}001`;
  }
  const lastCode = results[0].CodigoHerramienta;
  const regex = /^([A-Za-z]+)(\d+)$/;
  const match = lastCode.match(regex);
  if (match && match[1] === familyCode) {
    const lastCodeNumber = parseInt(match[2], 10);
    return `${familyCode}${(lastCodeNumber + 1).toString().padStart(3, '0')}`;
  }
  throw new Error('Formato de código no válido');
};

const create = async (data) => {
  const {
    CodigoHerramienta, Nombre, CodProveedor,
    CostoNeto, Precio1, Precio2, IVACompras, IVAVentas,
    Marca, Modelo, FechaAdquisicion, Ubicacion,
  } = data;

  if (
    !CodigoHerramienta ||
    !Nombre ||
    !CodProveedor ||
    CostoNeto === undefined || CostoNeto === null ||
    Precio1 === undefined || Precio1 === null ||
    Precio2 === undefined || Precio2 === null ||
    IVACompras === undefined || IVACompras === null ||
    IVAVentas === undefined || IVAVentas === null ||
    !Marca ||
    !Modelo ||
    !FechaAdquisicion ||
    !Ubicacion
  ) {
    throw new Error('Faltan campos obligatorios');
  }

  const insertId = await herramientaModel.insert(data);
  return insertId;
};

const updateCondicion = async (codigoHerramienta, tipo_operacion) => {
  if (!codigoHerramienta) throw new Error('Código de herramienta requerido');

  const operacionesValidas = ['Entrega', 'Devolucion'];
  if (!operacionesValidas.includes(tipo_operacion)) {
    throw new Error(`Operación inválida. Las operaciones válidas son: ${operacionesValidas.join(', ')}`);
  }

  const nuevaCondicion = tipo_operacion === 'Entrega' ? 'En Uso' : 'Disponible';
  const affected = await herramientaModel.updateCondicion(codigoHerramienta, nuevaCondicion);
  if (affected === 0) throw new Error('Herramienta no encontrada');
  return nuevaCondicion;
};

const getByResponsable = async (idResponsable) => {
  if (!idResponsable) throw new Error('Id de responsable requerido');
  const rows = await herramientaModel.getByResponsable(idResponsable);
  if (rows.length === 0) throw new Error('No se encontraron herramientas para este responsable');
  return rows;
};

const updateNombreCondicion = async (codigoHerramienta, Nombre, Condicion) => {
  if (!codigoHerramienta) throw new Error('Código de herramienta requerido');
  if (!Nombre || Nombre.trim() === '') {
    throw new Error('El nombre de la herramienta es obligatorio.');
  }
  if (!Condicion || Condicion.trim() === '') {
    throw new Error('La condición de la herramienta es obligatoria.');
  }
  const affected = await herramientaModel.updateNombreCondicion(codigoHerramienta, Nombre, Condicion);
  if (affected === 0) throw new Error('Herramienta no encontrada');
  return affected;
};

module.exports = {
  getAll,
  getDisponibles,
  getNextCode,
  create,
  updateCondicion,
  getByResponsable,
  updateNombreCondicion,
};
