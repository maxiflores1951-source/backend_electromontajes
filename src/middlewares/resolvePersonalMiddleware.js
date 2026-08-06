const db = require('../../db');

const resolvePersonal = async (req, res, next) => {
  try {
    if (req.user && req.user.id_personal != null) {
      req.idPersonal = req.user.id_personal;
      return next();
    }
    const [rows] = await db.execute('SELECT id_personal FROM usuarios WHERE id = ?', [req.user.id]);
    if (rows.length === 0 || rows[0].id_personal == null) {
      return res.status(401).json({ error: 'El usuario no tiene un personal asignado' });
    }
    req.idPersonal = rows[0].id_personal;
    next();
  } catch (err) {
    console.error('Error al resolver id_personal:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = resolvePersonal;
