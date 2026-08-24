const personalModel = require('../models/personalModel');
const { hashPassword } = require('../utils/bcryptUtils');

const getAll = async () => {
  return await personalModel.getAll();
};

const getById = async (id) => {
  const personal = await personalModel.getById(id);
  if (!personal) throw new Error(`No se encontró personal con ID: ${id}`);
  return personal;
};

const create = async (data, idUsuario) => {
  if (!data.NOMBRE && !data.nombre) {
    throw new Error('El nombre es requerido');
  }
  if (!data.DNI) {
    throw new Error('El DNI es requerido');
  }
  if (!data.id_rol) {
    throw new Error('El rol es requerido');
  }
  // Normalizar campos (el frontend envía en minúscula)
  data.NOMBRE = data.NOMBRE ?? data.nombre;
  data.apellido = data.apellido ?? null;
  data.id_creado = idUsuario;

  // El usuario/contrasena nacen del DNI: validar que no existan
  if (await personalModel.existsDni(data.DNI)) {
    const err = new Error('Ya existe un personal con ese DNI');
    err.code = 'ER_DUP_ENTRY';
    throw err;
  }
  if (await personalModel.findUsuarioByUsername(data.DNI)) {
    const err = new Error('Ya existe un usuario con ese DNI');
    err.code = 'ER_DUP_ENTRY';
    throw err;
  }

  const newId = await personalModel.insert(data);

  // Cuenta de usuario automatica: usuario = DNI, contrasena = DNI (encriptada)
  const contrasenaHash = await hashPassword(String(data.DNI));
  await personalModel.insertUsuario({
    usuario: String(data.DNI),
    contrasena: contrasenaHash,
    idPersonal: newId,
    idRol: data.id_rol,
    idCreado: idUsuario,
  });

  return getById(newId);
};

const update = async (id, data, idUsuario) => {
  if (!id) throw new Error('Falta el ID del personal');
  // Normalizar campos (el frontend envía en minúscula)
  if (data.NOMBRE === undefined && data.nombre !== undefined) data.NOMBRE = data.nombre;
  const idRol = data.id_rol;
  delete data.id_personal;
  delete data.ID;
  data.id_modificado = idUsuario;

  await personalModel.updateById(id, { ...data });

  // Sincronizar la cuenta de usuario vinculada (si existe):
  // - el rol elegido va a usuarios.id_rol; si no hay cuenta queda en personal.id_rol
  // - si cambia el DNI, el nombre de usuario (que es igual al DNI) se actualiza
  if ((idRol !== undefined && idRol !== null) || data.DNI !== undefined) {
    const cuenta = await personalModel.findUsuarioByPersonal(id);
    if (cuenta) {
      if (idRol !== undefined && idRol !== null) {
        await personalModel.updateUsuarioRol(id, idRol, idUsuario);
      }
      if (data.DNI !== undefined) {
        await personalModel.updateUsuarioUsername(id, String(data.DNI), idUsuario);
      }
    } else if (idRol !== undefined && idRol !== null) {
      await personalModel.updateById(id, { id_rol: idRol });
    }
  }

  return getById(id);
};

const remove = async (id) => {
  if (!id) throw new Error('Falta el ID del personal');
  await getById(id);
  const affected = await personalModel.deleteById(id);
  return affected;
};

module.exports = { getAll, getById, create, update, remove };
