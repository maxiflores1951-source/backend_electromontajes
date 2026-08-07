const db = require('../../db');

const getAll = async () => {
  const query = `
    SELECT epp.*,
           familiaepp.nombre AS nombre_familia,
           proveedor.Nombre_Prov AS nombre_proveedor
    FROM epp
    LEFT JOIN familiaepp ON epp.codigo_familia = familiaepp.codigo
    LEFT JOIN proveedor ON epp.Cod_Proveedor = proveedor.Cod_Proveedor
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getVariantes = async () => {
  const [rows] = await db.execute('SELECT * FROM epp_variantes');
  return rows;
};

const insert = async (data) => {
  const {
    nombre,
    codigo_familia,
    cantidad,
    marca,
    unidad,
    talla,
    estado,
    observaciones,
    Cod_Proveedor,
    iva_compras,
    certificado,
    codigo_tipo,
    id_creado,
  } = data;

  const query = `
    INSERT INTO epp (
      nombre,
      codigo_familia,
      cantidad,
      marca,
      unidad,
      talla,
      estado,
      observaciones,
      Cod_Proveedor,
      iva_compras,
      certificado,
      codigo_tipo,
      id_creado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    nombre,
    codigo_familia,
    cantidad,
    marca || null,
    unidad || null,
    talla || null,
    estado,
    observaciones || null,
    Cod_Proveedor,
    iva_compras,
    certificado ? 1 : 0,
    codigo_tipo,
    id_creado || null,
  ];

  const [result] = await db.query(query, values);
  return result.insertId;
};

const updateCantidad = async (codEpp, cantidad, operacion) => {
  const query = `
    UPDATE epp
    SET cantidad = cantidad ${operacion} ?
    WHERE codigo = ?
  `;
  const [result] = await db.execute(query, [cantidad, codEpp]);
  return result.affectedRows;
};

const getCantidad = async (codEpp) => {
  const [rows] = await db.execute('SELECT cantidad FROM epp WHERE codigo = ?', [codEpp]);
  return rows[0]?.cantidad ?? null;
};

const getByCodigo = async (codEpp) => {
  const [rows] = await db.execute('SELECT * FROM epp WHERE codigo = ?', [codEpp]);
  return rows[0];
};

const familiaEppExists = async (codigoFamilia) => {
  const [rows] = await db.execute('SELECT codigo FROM familiaepp WHERE codigo = ?', [codigoFamilia]);
  return rows.length > 0;
};

const proveedorExists = async (codProveedor) => {
  const [rows] = await db.execute('SELECT Cod_Proveedor FROM proveedor WHERE Cod_Proveedor = ?', [codProveedor]);
  return rows.length > 0;
};

module.exports = {
  getAll,
  getVariantes,
  insert,
  updateCantidad,
  getCantidad,
  getByCodigo,
  familiaEppExists,
  proveedorExists,
};
