const db = require('../../db');
const planCuentaModel = require('../models/planCuentaModel');

const getAllPlanes = async () => {
  return await planCuentaModel.getAll();
};

const createPlan = async (planData, idUsuario) => {
  if (!planData.codigo || !planData.nombre || !planData.tipo_cuenta) {
    throw new Error('Código, nombre y tipo de cuenta son requeridos');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    planData.id_creado = idUsuario;
    const newId = await planCuentaModel.insert(planData, connection);

    await connection.commit();
    return newId;
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      throw new Error('El código ya existe en la base de datos');
    }
    throw err;
  } finally {
    connection.release();
  }
};

const updatePlan = async (id, planData, idUsuario) => {
  if (!id) throw new Error('Falta el ID del plan');

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    planData.id_modificado = idUsuario;
    const affectedRows = await planCuentaModel.updateById(id, planData, connection);
    if (affectedRows === 0) {
      throw new Error(`No se encontró plan con ID: ${id}`);
    }

    await connection.commit();
    return affectedRows;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const deletePlan = async (id) => {
  if (!id) throw new Error('Falta el ID del plan');

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const affectedRows = await planCuentaModel.deleteById(id, connection);
    if (affectedRows === 0) {
      throw new Error(`No se encontró plan con ID: ${id}`);
    }

    await connection.commit();
    return affectedRows;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = { getAllPlanes, createPlan, updatePlan, deletePlan };