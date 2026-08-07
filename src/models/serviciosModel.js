const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute(`
    SELECT 
      s.*, 
      c.DENOMINACION AS nombre_cliente,
      e.descripcion AS nombre_estado
    FROM 
      servicios s
    JOIN 
      clientes c ON s.CODCLI = c.CODCLI
    LEFT JOIN 
      estados_pedido_obra e ON s.estado_id = e.id
    ORDER BY 
      s.IDOBRA DESC
  `);
  return rows;
};

const insert = async (data) => {
  const { OBRA, CODCLI, estado_id } = data;
  const [result] = await db.execute(`
    INSERT INTO servicios (OBRA, CODCLI, estado_id)
    VALUES (?, ?, ?)
  `, [OBRA, CODCLI, estado_id]);
  return result.insertId;
};

const updateObra = async (IDOBRA, obraFinal) => {
  await db.execute(`
    UPDATE servicios SET OBRA = ? WHERE IDOBRA = ?
  `, [obraFinal, IDOBRA]);
};

const getByCliente = async (codcli) => {
  const [rows] = await db.query(
    `SELECT * FROM servicios WHERE CODCLI = ? ORDER BY IDOBRA DESC`,
    [codcli]
  );
  return rows;
};

const getEstadosObra = async () => {
  const [rows] = await db.execute(`
    SELECT *
    FROM estados_pedido_obra
    ORDER BY id ASC
  `);
  return rows;
};

const update = async (IDOBRA, data) => {
  const { OBRA, CODCLI, estado_id } = data;
  const [result] = await db.execute(`
    UPDATE servicios
    SET OBRA = ?, CODCLI = ?, estado_id = ?
    WHERE IDOBRA = ?
  `, [OBRA, CODCLI, estado_id, IDOBRA]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  insert,
  updateObra,
  getByCliente,
  getEstadosObra,
  update,
};
