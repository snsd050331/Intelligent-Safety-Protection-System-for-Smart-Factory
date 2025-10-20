const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const USERS = [
	{ username: 'admin', password: 'pass123', role: 'admin' },
	{ username: 'test', password: 'test123', role: 'user' }
];

const DB_FILE = process.env.DB_FILE
	? path.resolve(__dirname, process.env.DB_FILE)
	: path.join(__dirname, 'auth.db');

async function ensureSchema(db) {
	const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
	if (fs.existsSync(schemaPath)) {
		const schemaSql = fs.readFileSync(schemaPath, 'utf8');
		await db.exec(schemaSql);
	}
}

async function main() {
	const db = await open({
		filename: DB_FILE,
		driver: sqlite3.Database
	});

	await db.exec('PRAGMA foreign_keys = ON;');
	await ensureSchema(db);

	for (const user of USERS) {
		const hash = await bcrypt.hash(user.password, 10);
		await db.run(
			`INSERT INTO users (username, password_hash, role)
			 VALUES (?, ?, ?)
			 ON CONFLICT(username) DO UPDATE SET
				password_hash = excluded.password_hash,
				role = excluded.role,
				updated_at = CURRENT_TIMESTAMP;`,
			[user.username, hash, user.role]
		);
		console.log(`Seeded user "${user.username}"`);
	}

	await db.close();
	console.log('Seeding complete.');
}

main().catch((err) => {
	console.error('Failed to seed database.', err);
	process.exit(1);
});
