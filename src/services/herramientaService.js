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

const validarReferencias = async (data) => {
  if (data.codigo_lugar) {
    const existe = await herramientaModel.lugarExists(data.codigo_lugar);
    if (!existe) throw new Error(`El código de lugar '${data.codigo_lugar}' no existe`);
  }
  if (data.id_marca) {
    const existe = await herramientaModel.marcaExists(data.id_marca);
    if (!existe) throw new Error(`La marca con id ${data.id_marca} no existe`);
  }
};

const create = async (data, idUsuario) => {
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

  await validarReferencias(data);

  const existing = await herramientaModel.getByCodigo(CodigoHerramienta);
  if (existing) {
    const mergedData = { ...existing, ...data };
    mergedData.id_modificado = idUsuario;
    await herramientaModel.updateById(CodigoHerramienta, mergedData);
    return { insertedId: CodigoHerramienta, updated: true };
  }

  data.id_creado = idUsuario;
  await herramientaModel.insert(data);
  return { insertedId: CodigoHerramienta, updated: false };
};

const updateCondicion = async (codigoHerramienta, tipo_operacion, idUsuario) => {
  if (!codigoHerramienta) throw new Error('Código de herramienta requerido');

  const operacionesValidas = ['Entrega', 'Devolucion'];
  if (!operacionesValidas.includes(tipo_operacion)) {
    throw new Error(`Operación inválida. Las operaciones válidas son: ${operacionesValidas.join(', ')}`);
  }

  const nuevaCondicion = tipo_operacion === 'Entrega' ? 'En Uso' : 'Disponible';
  const affected = await herramientaModel.updateCondicion(codigoHerramienta, nuevaCondicion, idUsuario);
  if (affected === 0) throw new Error('Herramienta no encontrada');
  return nuevaCondicion;
};

const update = async (codigoHerramienta, data, idUsuario) => {
  if (!codigoHerramienta) throw new Error('Código de herramienta requerido');
  const existing = await herramientaModel.getByCodigo(codigoHerramienta);
  if (!existing) throw new Error('Herramienta no encontrada');
  await validarReferencias(data);
  const mergedData = { ...existing, ...data };
  mergedData.id_modificado = idUsuario;
  const affected = await herramientaModel.updateById(codigoHerramienta, mergedData);
  return affected;
};

const getByResponsable = async (idResponsable) => {
  if (!idResponsable) throw new Error('Id de responsable requerido');
  const rows = await herramientaModel.getByResponsable(idResponsable);
  if (rows.length === 0) throw new Error('No se encontraron herramientas para este responsable');
  return rows;
};

const updateNombreCondicion = async (codigoHerramienta, Nombre, Condicion, idUsuario) => {
  if (!codigoHerramienta) throw new Error('Código de herramienta requerido');
  if (!Nombre || Nombre.trim() === '') {
    throw new Error('El nombre de la herramienta es obligatorio.');
  }
  if (!Condicion || Condicion.trim() === '') {
    throw new Error('La condición de la herramienta es obligatoria.');
  }
  const affected = await herramientaModel.updateNombreCondicion(codigoHerramienta, Nombre, Condicion, idUsuario);
  if (affected === 0) throw new Error('Herramienta no encontrada');
  return affected;
};

module.exports = {
  getAll,
  getDisponibles,
  getNextCode,
  create,
  updateCondicion,
  update,
  getByResponsable,
  updateNombreCondicion,
};
