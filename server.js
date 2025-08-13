const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketio = require('socket.io');
require('dotenv').config();

// Middleware de autenticación JWT
const verificarToken = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middlewares globales
app.use(cookieParser());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public')); // Para servir HTML/CSS/JS

// Cuando el usuario entra a la raíz, mostrar tablero
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/tablero.html');
});

// Configuración de Passport con Google OAuth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

// Ruta para iniciar OAuth con Google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Ruta de callback de Google OAuth
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user.id, name: req.user.displayName },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/tablero.html'); // Redirige a tu página principal
    }
);

// Ruta protegida con JWT
app.get('/api/profile', verificarToken, (req, res) => {
    res.json({ mensaje: 'Perfil de usuario', usuario: req.user });
});

// --- Socket.io: Tablero de Ideas ---
let ideas = [];

io.on('connection', (socket) => {
    console.log('Usuario conectado');

    // Enviar ideas existentes al nuevo usuario
    socket.emit('ideas', ideas);

    // Recibir nueva idea y reenviarla a todos
    socket.on('nueva_idea', (idea) => {
        ideas.push(idea);
        io.emit('ideas', ideas);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado con éxito en: 🌐 http://localhost:${PORT}`);
    console.log(`📡 Esperando conexiones...`);
});
