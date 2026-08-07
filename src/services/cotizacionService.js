const cotizacionModel = require('../models/cotizacionModel');

const getAll = async () => {
  return await cotizacionModel.getAll();
};

const create = async (data) => {
  const { nombre_cot, unidad_cot } = data;
  const result = await cotizacionModel.insert({ nombre_cot, unidad_cot });
  return result.insertId;
};

const deleteById = async (id) => {
  await cotizacionModel.deleteById(id);
};

const getArticulos = async (codigo_cotizacion, codigo_detalle) => {
  return await cotizacionModel.getArticulos(codigo_cotizacion, codigo_detalle);
};

const getMateriales = async () => {
  const rows = await cotizacionModel.getMateriales();

  const result = rows.reduce((acc, row) => {
    const key = row.codigo_cotizacion;
    if (!acc[key]) {
      acc[key] = {
        codigo_cotizacion: row.codigo_cotizacion,
        nombre_cotizacion: row.nombre_cotizacion,
        materiales: [],
      };
    }
    acc[key].materiales.push({
      cod_articulo: row.cod_articulo,
      nombre_articulo: row.nombre_articulo,
      unidad: row.unidad,
      cantidad: row.cantidad,
    });
    return acc;
  }, {});

  return Object.values(result);
};

module.exports = {
  getAll,
  create,
  deleteById,
  getArticulos,
  getMateriales,
};
