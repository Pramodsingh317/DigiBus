require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.')); // Serve static files (index.html, style.css, app.js)

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'digibus_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// ── AUTH ENDPOINTS ──────────────────────────────────────────

app.post('/api/register', (req, res) => {
    const { id, role, studentId, dob, pass } = req.body;
    const query = 'INSERT INTO users (id, role, studentId, dob, pass) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [id, role, studentId, dob, pass], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Account already exists' });
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'User registered successfully' });
    });
});

app.post('/api/login', (req, res) => {
    const { uid, pass } = req.body;
    const query = 'SELECT * FROM users WHERE (id = ? OR studentId = ? OR email = ?) AND pass = ?';
    db.query(query, [uid, uid, uid, pass], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            res.json({ user: results[0] });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// ── REQUESTS ENDPOINTS ──────────────────────────────────────

app.get('/api/requests', (req, res) => {
    db.query('SELECT * FROM requests', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/requests', (req, res) => {
    const r = req.body;
    const query = 'INSERT INTO requests (id, studentId, studentName, studentPhone, studentPhoto, route, stop, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [r.id, r.studentId, r.studentName, r.studentPhone, r.studentPhoto, r.route, r.stop, r.status], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Request submitted' });
    });
});

app.put('/api/requests/:id', (req, res) => {
    const id = req.params.id;
    const patch = req.body;
    const query = 'UPDATE requests SET ? WHERE id = ?';
    db.query(query, [patch, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Request updated' });
    });
});

app.delete('/api/requests/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM requests WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Request deleted' });
    });
});

app.delete('/api/requests', (req, res) => {
    db.query('DELETE FROM requests', (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'All requests deleted' });
    });
});

// ── ROUTES ENDPOINTS ────────────────────────────────────────

app.get('/api/routes', (req, res) => {
    db.query('SELECT r.name as routeName, s.stopName FROM routes r LEFT JOIN stops s ON r.name = s.routeName', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Group by route
        const routes = {};
        results.forEach(row => {
            if (!routes[row.routeName]) routes[row.routeName] = [];
            if (row.stopName) routes[row.routeName].push(row.stopName);
        });
        res.json(routes);
    });
});

app.post('/api/routes', (req, res) => {
    const { name, stops } = req.body;
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });

        db.query('INSERT INTO routes (name) VALUES (?)', [name], (err) => {
            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

            if (stops && stops.length > 0) {
                const values = stops.map(s => [name, s]);
                db.query('INSERT INTO stops (routeName, stopName) VALUES ?', [values], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                        res.json({ message: 'Route added' });
                    });
                });
            } else {
                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                    res.json({ message: 'Route added' });
                });
            }
        });
    });
});

app.delete('/api/routes/:name', (req, res) => {
    db.query('DELETE FROM routes WHERE name = ?', [req.params.name], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Route deleted' });
    });
});

// ── SETTINGS ENDPOINTS ──────────────────────────────────────

app.get('/api/settings', (req, res) => {
    db.query('SELECT * FROM settings WHERE id = 1', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0] || {});
    });
});

app.post('/api/settings', (req, res) => {
    const s = req.body;
    const query = 'INSERT INTO settings (id, collegeName, validFrom, validTo, collegeStamp, collegeLogo, bankAccount) VALUES (1, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE collegeName=VALUES(collegeName), validFrom=VALUES(validFrom), validTo=VALUES(validTo), collegeStamp=VALUES(collegeStamp), collegeLogo=VALUES(collegeLogo), bankAccount=VALUES(bankAccount)';
    db.query(query, [s.collegeName, s.validFrom, s.validTo, s.collegeStamp, s.collegeLogo, s.bankAccount], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Settings saved' });
    });
});

// ── FEEDBACK ENDPOINTS ──────────────────────────────────────

app.get('/api/feedback', (req, res) => {
    db.query('SELECT * FROM feedback ORDER BY createdAt DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/feedback', (req, res) => {
    const { id, name, email, note } = req.body;
    const query = 'INSERT INTO feedback (id, name, email, note, createdAt) VALUES (?, ?, ?, ?, NOW())';
    db.query(query, [id, name || 'Anonymous', email || '', note || ''], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Feedback submitted' });
    });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = { app, db };
