// db.js
const mysql = require('mysql2/promise');

// Crear la conexión
const db = mysql.createPool({
  host: 'localhost',
  user: 'root', // Reemplaza con tu usuario de MySQL
  password: '', // Reemplaza con tu contraseña de MySQL
  database: 'electromontajes3',
});

module.exports = db;
