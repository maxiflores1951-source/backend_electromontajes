const { body, validationResult } = require('express-validator');

const validateLogin = [
  body('usuario').notEmpty().withMessage('El usuario es obligatorio').trim(),
  body('contrasena').notEmpty().withMessage('La contraseña es obligatoria'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  }
];

const validateProveedor = (req, res, next) => {
  const { Cuilt, Razon_Social, Nombre_Prov, IDSITFISCAL } = req.body;
  if (!Cuilt || !Razon_Social || !Nombre_Prov || !IDSITFISCAL) {
    return res.status(400).json({
      error: 'Cuilt, Razon_Social, Nombre_Prov e IDSITFISCAL son requeridos'
    });
  }
  next();
};

module.exports = { validateLogin, validateProveedor };