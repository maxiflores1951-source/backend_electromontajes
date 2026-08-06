const db = require('../../db');

// Construye el filtro según el estado solicitado en el query string
const buildEstadoFilter = (estado) => {
  if (!estado) return '';
  switch (estado.toLowerCase()) {
    case 'disponible':
      return `AND (h.Condicion != 'Baja' AND
              (mh.actual IS NULL OR
               msh.tipo_operacion = 'Devolucion' OR
               (mh.actual = 1 AND msh.tipo_operacion = 'Devolucion')))`;
    case 'en uso':
    case 'enuso':
      return `AND h.Condicion != 'Baja'
              AND mh.actual = 1
              AND msh.tipo_operacion = 'Entrega'`;
    case 'baja':
      return `AND h.Condicion = 'Baja'`;
    default:
      return '';
  }
};

const getAll = async (estado) => {
  const estadoFiltro = buildEstadoFilter(estado);
  const query = `
    SELECT
      h.CodigoHerramienta,
      h.Nombre,
      h.CodigoFamilia,
      f.Nom_Familia,
      h.CodProveedor,
      p.Nombre_Prov,
      h.CostoNeto,
      h.Precio1,
      h.Precio2,
      h.IVACompras,
      h.IVAVentas,
      h.Marca,
      h.id_marca,
      m.nombre as nombre_marca,
      h.Modelo,
      h.FechaAdquisicion,
      h.ImagenPath,
      h.Condicion,
      h.Ubicacion,
      h.codigo_lugar,
      l.nombre_lugar,
      h.Observacion,
      h.FechaCreacion,
      h.FechaModificacion,
      CASE WHEN h.Condicion = 'Baja' THEN 'Baja'
        WHEN mh.actual = 1 AND msh.tipo_operacion = 'Entrega' THEN 'En uso'
        ELSE 'Disponible'
      END as estado,
      per.NOMBRE as personal_nombre_asignado,
      per.DNI as personal_dni_asignado
    FROM
      Herramienta h
    JOIN
      familiaherramienta f ON h.CodigoFamilia = f.Cod_Familia
    JOIN
      proveedor p ON h.CodProveedor = p.Cod_Proveedor
    LEFT JOIN marcas m ON h.id_marca = m.id
    LEFT JOIN lugares l ON h.codigo_lugar = l.codigo
    LEFT JOIN movimiento_herramientas mh
      ON h.CodigoHerramienta = mh.codigoHerramienta
      AND mh.actual = 1
    LEFT JOIN movimientosstockherramientas msh
      ON mh.movimiento_id = msh.id
    LEFT JOIN personal per
      ON msh.responsable = per.ID
    WHERE 1=1 ${estadoFiltro}
    ORDER BY h.CodigoHerramienta
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getDisponibles = async () => {
  const query = `
    SELECT
      h.CodigoHerramienta,
      h.Nombre,
      h.CodigoFamilia,
      f.Nom_Familia,
      h.CodProveedor,
      h.CostoNeto,
      h.Precio1,
      h.Precio2,
      h.IVACompras,
      h.IVAVentas,
      h.Marca,
      h.id_marca,
      m.nombre as nombre_marca,
      h.Modelo,
      h.FechaAdquisicion,
      h.ImagenPath,
      h.Condicion,
      h.Ubicacion,
      h.codigo_lugar,
      l.nombre_lugar,
      h.Observacion,
      h.FechaCreacion,
      h.FechaModificacion
    FROM
      Herramienta h
    JOIN
      familiaherramienta f ON h.CodigoFamilia = f.Cod_Familia
    LEFT JOIN marcas m ON h.id_marca = m.id
    LEFT JOIN lugares l ON h.codigo_lugar = l.codigo
    WHERE
      h.Condicion = 'Disponible';
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getNextCode = async (familyCode) => {
  const query = `
    SELECT CodigoHerramienta FROM Herramienta
    WHERE CodigoFamilia = ?
    ORDER BY LENGTH(CodigoHerramienta) DESC, CodigoHerramienta DESC LIMIT 1
  `;
  const [results] = await db.query(query, [familyCode]);
  return results;
};

const getByCodigo = async (codigoHerramienta) => {
  const [rows] = await db.execute('SELECT * FROM herramienta WHERE CodigoHerramienta = ?', [codigoHerramienta]);
  return rows[0];
};

const lugarExists = async (codigo) => {
  const [rows] = await db.query('SELECT codigo FROM lugares WHERE codigo = ?', [codigo]);
  return rows.length > 0;
};

const marcaExists = async (id) => {
  const [rows] = await db.query('SELECT id FROM marcas WHERE id = ?', [id]);
  return rows.length > 0;
};

const insert = async (data) => {
  const {
    CodigoHerramienta, Nombre, CodigoFamilia, CodProveedor,
    CostoNeto, Precio1, Precio2, IVACompras, IVAVentas,
    Marca, Modelo, FechaAdquisicion, ImagenPath, Condicion,
    Ubicacion, Observacion,
  } = data;

  const sql = `
    INSERT INTO Herramienta (
      CodigoHerramienta,
      Nombre,
      CodigoFamilia,
      CodProveedor,
      CostoNeto,
      Precio1,
      Precio2,
      IVACompras,
      IVAVentas,
      Marca,
      id_marca,
      Modelo,
      FechaAdquisicion,
      ImagenPath,
      Condicion,
      Ubicacion,
      codigo_lugar,
      Observacion,
      id_creacion,
      id_creado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.query(sql, [
    CodigoHerramienta,
    Nombre,
    CodigoFamilia,
    CodProveedor,
    CostoNeto || 0,
    Precio1 || 0,
    Precio2 || 0,
    IVACompras || 0,
    IVAVentas || 0,
    Marca,
    data.id_marca,
    Modelo,
    FechaAdquisicion,
    ImagenPath,
    Condicion,
    Ubicacion,
    data.codigo_lugar,
    Observacion,
    data.id_creado || null,
    data.id_creado || null,
  ]);
  return result.insertId;
};

const updateCondicion = async (codigoHerramienta, nuevaCondicion, idUsuario) => {
  const query = `
    UPDATE herramienta
    SET Condicion = ?,
        id_modificacion = ?,
        id_modificado = ?,
        FechaModificacion = NOW()
    WHERE CodigoHerramienta = ?
  `;
  const [result] = await db.execute(query, [nuevaCondicion, idUsuario || null, idUsuario || null, codigoHerramienta]);
  return result.affectedRows;
};

const getByResponsable = async (idResponsable) => {
  const query = `
    SELECT
      h.CodigoHerramienta,
      h.Nombre,
      h.CodigoFamilia,
      h.CodProveedor,
      h.CostoNeto,
      h.Precio1,
      h.Precio2,
      h.IVACompras,
      h.IVAVentas,
      h.Marca,
      h.id_marca,
      m.nombre as nombre_marca,
      h.Modelo,
      h.FechaAdquisicion,
      h.ImagenPath,
      h.Condicion,
      h.Ubicacion,
      h.codigo_lugar,
      l.nombre_lugar,
      h.Observacion,
      h.FechaCreacion,
      h.FechaModificacion,
      msh.responsable,
      msh.fecha_registro,
      msh.tipo_operacion
    FROM
      Herramienta h
    JOIN
      movimiento_herramientas mh ON h.CodigoHerramienta = mh.codigoHerramienta
    JOIN
      movimientosstockherramientas msh ON mh.movimiento_id = msh.id
    LEFT JOIN marcas m ON h.id_marca = m.id
    LEFT JOIN lugares l ON h.codigo_lugar = l.codigo
    WHERE
      msh.responsable = ?
      AND mh.actual = 1
      AND msh.tipo_operacion = "Entrega"
  `;
  const [rows] = await db.query(query, [idResponsable]);
  return rows;
};

const updateNombreCondicion = async (codigoHerramienta, Nombre, Condicion, idUsuario) => {
  const query = `
    UPDATE herramienta
    SET Nombre = ?, Condicion = ?,
        id_modificacion = ?,
        id_modificado = ?,
        FechaModificacion = NOW()
    WHERE CodigoHerramienta = ?
  `;
  const [result] = await db.execute(query, [Nombre, Condicion, idUsuario || null, idUsuario || null, codigoHerramienta]);
  return result.affectedRows;
};

const updateById = async (codigoHerramienta, data) => {
  const {
    Nombre, CodigoFamilia, CodProveedor,
    CostoNeto, Precio1, Precio2, IVACompras, IVAVentas,
    Marca, id_marca, Modelo, FechaAdquisicion, ImagenPath,
    Condicion, Ubicacion, codigo_lugar, Observacion,
    id_modificado,
  } = data;

  const query = `
    UPDATE herramienta
    SET
      Nombre = ?,
      CodProveedor = ?,
      CostoNeto = ?,
      Precio1 = ?,
      Precio2 = ?,
      IVACompras = ?,
      IVAVentas = ?,
      Marca = ?,
      id_marca = ?,
      Modelo = ?,
      FechaAdquisicion = ?,
      ImagenPath = ?,
      Condicion = ?,
      Ubicacion = ?,
      codigo_lugar = ?,
      Observacion = ?,
      id_modificacion = ?,
      id_modificado = ?,
      FechaModificacion = NOW()
    WHERE CodigoHerramienta = ?
  `;

  const [result] = await db.execute(query, [
    Nombre,
    CodProveedor,
    CostoNeto || 0,
    Precio1 || 0,
    Precio2 || 0,
    IVACompras || 0,
    IVAVentas || 0,
    Marca,
    id_marca || null,
    Modelo,
    FechaAdquisicion,
    ImagenPath,
    Condicion,
    Ubicacion,
    codigo_lugar || null,
    Observacion,
    id_modificado || null,
    id_modificado || null,
    codigoHerramienta,
  ]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  getDisponibles,
  getNextCode,
  getByCodigo,
  lugarExists,
  marcaExists,
  insert,
  updateCondicion,
  getByResponsable,
  updateNombreCondicion,
  updateById,
};
