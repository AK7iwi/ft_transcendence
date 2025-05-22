const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');



const app = express();
db.initializeDatabase();


// 🔐 Certificats SSL
const options = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
};

// 🖼️ Favicon (ou remplacer par un vrai plus tard)
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'certs', 'cert.pem'));
});

// 🌐 CORS
app.use(cors({
  origin: 'https://localhost:5173',
  credentials: true
}));

// 📦 Middlewares JSON + URL-encoded
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🛡️ CSP headers
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'"
  );
  next();
});
// 🔐 Route pour obtenir les infos de l'utilisateur connecté
app.get('/auth/me', authenticateToken, async (req, res) => {
  const user = await db.getUserByUsername(req.user.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    username: user.username,
    email: user.email,
    twoFactorEnabled: user.two_factor_enabled // 🔐 important
  });
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalid' });
    req.user = user; // Attach decoded user info
    next();
  });
}


// 🧪 Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});



// ✅ Inscription
app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  console.log("REGISTER PAYLOAD:", req.body);

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing username, email, or password' });
  }

  try {
    const exists = await db.getUserByUsername(username);
    if (exists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    await db.createUser({ username, email, password });
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Connexion
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  try {
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ✅ Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '2h'
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});
// ✅ Génération du secret 2FA et QR code (pour Authy)
app.post('/auth/2fa/setup', authenticateToken, async (req, res) => {
  const user = await db.getUserByUsername(req.user.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const secret = speakeasy.generateSecret({ name: `PongApp (${user.username})` });

  await db.storeTwoFactorSecret(user.username, secret.base32);

  qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
    if (err) return res.status(500).json({ error: 'Failed to generate QR code' });
    res.status(200).json({ qrCode: data_url });
  });
});

// ✅ Vérification du code 2FA et activation
app.post('/auth/2fa/verify', authenticateToken, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: '2FA token missing' });

  const user = await db.getUserByUsername(req.user.username);
  if (!user || !user.two_factor_secret) {
    return res.status(404).json({ error: '2FA not configured for this user' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token
  });

  if (!verified) {
    return res.status(401).json({ error: 'Invalid 2FA token' });
  }

  await db.enableTwoFactor(user.username);
  res.status(200).json({ message: '2FA enabled successfully' });
});


app.put('/auth/update', async (req, res) => {
  const { username, newUsername} = req.body;
  if (!username) return res.status(400).json({ error: 'Missing current username' });

  try {
    await db.updateUser(username, newUsername);
    const user = await db.getUserByUsername(newUsername || username);
    res.status(200).json({ message: 'User updated', user });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ error: 'Update error' });
  }
});

app.post('/user/password', async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Missing username or new password' });
  }

  try {
    await db.updatePassword(username, newPassword);
    res.status(200).json({ message: 'Password updated' });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});


// 🚀 Lancer le serveur HTTPS
https.createServer(options, app).listen(3000, () => {
  console.log('Backend running at https://localhost:3000');
});

