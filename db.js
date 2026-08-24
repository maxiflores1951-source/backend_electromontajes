// db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

// Crear la conexión
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', // Reemplaza con tu usuario de MySQL
  password: process.env.DB_PASSWORD || '', // Reemplaza con tu contraseña de MySQL
  database: process.env.DB_NAME || 'electromontajes3',
});

module.exports = db;
