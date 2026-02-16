// backend/db.js
const mysql = require('mysql2');
require('dotenv').config();

// Railway injeta automaticamente as variáveis MYSQLHOST, MYSQLPORT, etc.
const db = mysql.createConnection({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'root',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'cardapio_db',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) {
        console.error('❌ Erro MySQL:', err.message);
        return;
    }
    console.log('✅ MySQL conectado!');
});

module.exports = db;