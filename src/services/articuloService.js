const articuloModel = require('../models/articuloModel');

const getAll = async () => {
  return await articuloModel.getAll();
};

const getByProveedor = async (codProveedor) => {
  if (!codProveedor) throw new Error('Código de proveedor requerido');
  const articulos = await articuloModel.getByProveedor(codProveedor);
  if (articulos.length === 0) throw new Error('No se encontraron artículos para este proveedor');
  return articulos;
};

const getByCodigo = async (codArticulo) => {
  if (!codArticulo) throw new Error('Código de artículo requerido');
  const articulo = await articuloModel.getByCodigo(codArticulo);
  if (!articulo) throw new Error(`No se encontró artículo con código: ${codArticulo}`);
  return articulo;
};

const create = async (data, idUsuario) => {
  if (!data.Cod_Articulo || !data.Nombre_Art || !data.Cod_Familia || !data.Cod_Proveedor) {
    throw new Error('Cod_Articulo, Nombre_Art, Cod_Familia y Cod_Proveedor son requeridos');
  }
  if (data.Cod_Articulo && data.Cod_Articulo.length < 10) {
    data.Cod_Articulo = data.Cod_Articulo.padStart(10, '0');
  }
  data.id_creado = idUsuario;
  data.Cantidad = 0;
  data.cantidad_perales = 0;
  if (data.imagen_base64 && data.imagen_base64.trim() === '') {
    data.imagen_base64 = null;
  }
  return await articuloModel.insert(data);
};

const update = async (codArticulo, data, idUsuario) => {
  if (!codArticulo) throw new Error('Falta el código del artículo');
  const existing = await articuloModel.getByCodigo(codArticulo);
  if (!existing) throw new Error(`No se encontró artículo con código: ${codArticulo}`);
  const mergedData = { ...existing, ...data };
  mergedData.id_modificado = idUsuario;
  const affected = await articuloModel.updateById(codArticulo, mergedData);
  return affected;
};

const ajustarStock = async (codArticulo, cantidad, tipoOperacion, idLugar) => {
  if (!codArticulo) throw new Error('Código de artículo requerido');
  if (!['Entrada', 'Salida'].includes(tipoOperacion)) {
    throw new Error('Tipo de operación inválido. Debe ser "Entrada" o "Salida".');
  }
  const cantidadNum = parseFloat(cantidad);
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    throw new Error('La cantidad debe ser un número válido mayor a 0.');
  }

  let campo;
  let nombreLugar;
  if (!idLugar || idLugar === 'TQ') {
    campo = 'Cantidad';
    nombreLugar = 'Tilquiza';
  } else if (idLugar === 'PE') {
    campo = 'cantidad_perales';
    nombreLugar = 'Perales';
  } else {
    throw new Error('ID de lugar inválido. Debe ser "PE" o "TQ".');
  }

  const stock = await articuloModel.getCantidad(codArticulo);
  if (!stock) throw new Error(`No se encontró artículo con código: ${codArticulo}`);

  const cantidadActual = parseFloat(stock[campo]) || 0;
  let nuevaCantidad;

  if (tipoOperacion === 'Entrada') {
    nuevaCantidad = cantidadActual + cantidadNum;
  } else {
    nuevaCantidad = Math.max(0, cantidadActual - cantidadNum);
  }

  const affected = await articuloModel.updateCantidad(codArticulo, campo, nuevaCantidad);
  if (affected === 0) throw new Error(`No se encontró artículo con código: ${codArticulo}`);

  return { nuevaCantidad, nombreLugar, lugar: idLugar || 'TQ' };
};

module.exports = { getAll, getByProveedor, getByCodigo, create, update, ajustarStock };
