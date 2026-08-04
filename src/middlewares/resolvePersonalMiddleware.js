const db = require('../../db');

const resolvePersonal = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT id_personal FROM usuarios WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    req.idPersonal = rows[0].id_personal;
    next();
  } catch (err) {
    console.error('Error al resolver id_personal:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = resolvePersonal;
