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
      h.Modelo,
      h.FechaAdquisicion,
      h.ImagenPath,
      h.Condicion,
      h.Ubicacion,
      h.Observacion,
      CASE
        WHEN h.Condicion = 'Baja' THEN 'Baja'
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
      h.Modelo,
      h.FechaAdquisicion,
      h.ImagenPath,
      h.Condicion,
      h.Ubicacion,
      h.Observacion
    FROM
      Herramienta h
    JOIN
      familiaherramienta f ON h.CodigoFamilia = f.Cod_Familia
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
    ORDER BY CodigoHerramienta DESC LIMIT 1
  `;
  const [results] = await db.query(query, [familyCode]);
  return results;
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
      Modelo,
      FechaAdquisicion,
      ImagenPath,
      Condicion,
      Ubicacion,
      Observacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    Modelo,
    FechaAdquisicion,
    ImagenPath,
    Condicion,
    Ubicacion,
    Observacion,
  ]);
  return result.insertId;
};

const updateCondicion = async (codigoHerramienta, nuevaCondicion) => {
  const query = `
    UPDATE herramienta
    SET Condicion = ?
    WHERE CodigoHerramienta = ?
  `;
  const [result] = await db.execute(query, [nuevaCondicion, codigoHerramienta]);
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
      h.Modelo,
      h.FechaAdquisicion,
      h.ImagenPath,
      h.Condicion,
      h.Ubicacion,
      h.Observacion,
      msh.responsable,
      msh.fecha_registro,
      msh.tipo_operacion
    FROM
      Herramienta h
    JOIN
      movimiento_herramientas mh ON h.CodigoHerramienta = mh.codigoHerramienta
    JOIN
      movimientosstockherramientas msh ON mh.movimiento_id = msh.id
    WHERE
      msh.responsable = ?
      AND mh.actual = 1
      AND msh.tipo_operacion = "Entrega"
  `;
  const [rows] = await db.query(query, [idResponsable]);
  return rows;
};

const updateNombreCondicion = async (codigoHerramienta, Nombre, Condicion) => {
  const query = `
    UPDATE herramienta
    SET Nombre = ?, Condicion = ?
    WHERE CodigoHerramienta = ?
  `;
  const [result] = await db.execute(query, [Nombre, Condicion, codigoHerramienta]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  getDisponibles,
  getNextCode,
  insert,
  updateCondicion,
  getByResponsable,
  updateNombreCondicion,
};
