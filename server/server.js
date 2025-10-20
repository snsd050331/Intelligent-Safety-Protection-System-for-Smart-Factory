const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE
	? path.resolve(__dirname, process.env.DB_FILE)
	: path.join(__dirname, 'auth.db');

let db;

async function initializeDatabase() {
	db = await open({
		filename: DB_FILE,
		driver: sqlite3.Database
	});

	await db.exec('PRAGMA foreign_keys = ON;');

	const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
	if (fs.existsSync(schemaPath)) {
		const schemaSql = fs.readFileSync(schemaPath, 'utf8');
		await db.exec(schemaSql);
	}
}

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
	if (!db) {
		return res.status(503).json({ error: '資料庫尚未啟動，請稍後再試。' });
	}
	return next();
});

app.post('/api/login', async (req, res) => {
	const { username, password } = req.body || {};

	if (!username || !password) {
		return res.status(400).json({ error: '缺少帳號或密碼。' });
	}

	try {
		const user = await db.get(
			'SELECT username, password_hash FROM users WHERE username = ? LIMIT 1',
			username
		);

		if (!user) {
			return res.status(401).json({ error: '帳號或密碼錯誤。' });
		}

		const ok = await bcrypt.compare(password, user.password_hash);

		if (!ok) {
			return res.status(401).json({ error: '帳號或密碼錯誤。' });
		}

		return res.json({ message: '登入成功。' });
	} catch (err) {
		console.error('Login error', err);
		return res.status(500).json({ error: '伺服器暫時無法處理登入。' });
	}
});

initializeDatabase()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Auth server running on http://localhost:${PORT}`);
		});
	})
	.catch((err) => {
		console.error('Failed to initialize database.', err);
		process.exit(1);
	});
