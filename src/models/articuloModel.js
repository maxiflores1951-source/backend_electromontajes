const db = require('../../db');

const getAll = async () => {
  const query = `
    SELECT
      a.Cod_Articulo,
      a.Nombre_Art,
      f.Nombre_Fam,
      a.Precio_Lista0,
      a.Precio_Lista1,
      a.Precio_Lista2,
      a.Cantidad,
      a.Costo_Neto,
      p.Nombre_Prov,
      a.Unidad,
      fu.Descripcion AS Descripcion_Unidad,
      a.Descuento,
      a.Iva_Compras,
      a.Iva_Ventas,
      a.Marca,
      a.id_marca,
      a.imagen_base64,
      a.Cod_Proveedor,
      a.cantidad_perales,
      m.nombre AS Nombre_Marca
    FROM articulo a
    JOIN familia f ON a.Cod_Familia = f.Cod_Familia
    JOIN proveedor p ON a.Cod_Proveedor = p.Cod_Proveedor
    LEFT JOIN familiaunidad fu ON a.Unidad = fu.Cod_Unidad
    LEFT JOIN marcas m ON a.id_marca = m.id
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getByProveedor = async (codProveedor) => {
  const query = `
    SELECT
      a.*,
      f.Nombre_Fam,
      p.Nombre_Prov,
      m.nombre AS Nombre_Marca
    FROM articulo a
    JOIN familia f ON a.Cod_Familia = f.Cod_Familia
    JOIN proveedor p ON a.Cod_Proveedor = p.Cod_Proveedor
    LEFT JOIN marcas m ON a.id_marca = m.id
    WHERE a.Cod_Proveedor = ?
  `;
  const [rows] = await db.execute(query, [codProveedor]);
  return rows;
};

const getByCodigo = async (codArticulo) => {
  const [rows] = await db.execute('SELECT * FROM articulo WHERE Cod_Articulo = ?', [codArticulo]);
  return rows[0];
};

const insert = async (data) => {
  const {
    Cod_Articulo, Nombre_Art, Cod_Familia,
    Precio_Lista0, Precio_Lista1, Precio_Lista2,
    Unidad, Cantidad, Descuento, Cod_Proveedor,
    id_marca, Iva_Compras, Iva_Ventas, Marca,
    imagen_base64, Costo_Neto, cantidad_perales,
    id_creado
  } = data;

  const query = `
    INSERT INTO articulo
    (Cod_Articulo, Nombre_Art, Cod_Familia,
     Precio_Lista0, Precio_Lista1, Precio_Lista2,
     Unidad, Cantidad, Descuento, Cod_Proveedor,
     id_marca, Iva_Compras, Iva_Ventas, Marca,
     imagen_base64, Costo_Neto, cantidad_perales,
     id_creado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [
    Cod_Articulo, Nombre_Art, Cod_Familia,
    Precio_Lista0 ?? null, Precio_Lista1 ?? null, Precio_Lista2 ?? null,
    Unidad, Cantidad ?? null, Descuento ?? 0, Cod_Proveedor,
    id_marca ?? null, Iva_Compras ?? 0, Iva_Ventas ?? 0, Marca,
    imagen_base64 ?? null, Costo_Neto ?? null, cantidad_perales ?? 0,
    id_creado || null
  ]);
  return result.affectedRows;
};

const updateById = async (codArticulo, data) => {
  const {
    Nombre_Art, Cod_Familia,
    Precio_Lista0, Precio_Lista1, Precio_Lista2,
    Unidad, Cantidad, Descuento, Cod_Proveedor,
    id_marca, Iva_Compras, Iva_Ventas, Marca,
    imagen_base64, Costo_Neto, cantidad_perales,
    id_modificado
  } = data;

  const query = `
    UPDATE articulo
    SET
      Nombre_Art = ?,
      Cod_Familia = ?,
      Precio_Lista0 = ?,
      Precio_Lista1 = ?,
      Precio_Lista2 = ?,
      Unidad = ?,
      Cantidad = ?,
      Descuento = ?,
      Cod_Proveedor = ?,
      id_marca = ?,
      Iva_Compras = ?,
      Iva_Ventas = ?,
      Marca = ?,
      imagen_base64 = ?,
      Costo_Neto = ?,
      cantidad_perales = ?,
      id_modificado = ?,
      fecha_modificacion = NOW()
    WHERE Cod_Articulo = ?
  `;
  const [result] = await db.execute(query, [
    Nombre_Art, Cod_Familia,
    Precio_Lista0 ?? null, Precio_Lista1 ?? null, Precio_Lista2 ?? null,
    Unidad, Cantidad ?? null, Descuento ?? 0, Cod_Proveedor,
    id_marca ?? null, Iva_Compras ?? 0, Iva_Ventas ?? 0,
    Marca, imagen_base64 ?? null, Costo_Neto ?? null,
    cantidad_perales ?? 0, id_modificado || null,
    codArticulo
  ]);
  return result.affectedRows;
};

const getCantidad = async (codArticulo) => {
  const [rows] = await db.execute('SELECT Cantidad, cantidad_perales FROM articulo WHERE Cod_Articulo = ?', [codArticulo]);
  return rows[0] || null;
};

const updateCantidad = async (codArticulo, campo, nuevaCantidad) => {
  const query = `UPDATE articulo SET ${campo} = ?, fecha_modificacion = NOW() WHERE Cod_Articulo = ?`;
  const [result] = await db.execute(query, [nuevaCantidad, codArticulo]);
  return result.affectedRows;
};

module.exports = { getAll, getByProveedor, getByCodigo, insert, updateById, getCantidad, updateCantidad };
