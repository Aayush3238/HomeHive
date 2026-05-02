const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const loadEnv = require('./config/loadEnv');
const PostgresSessionStore = require('./db/sessionStore');
const { initDb } = require('./db');

loadEnv();

const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const userRouter = require('./routes/userRouter');
const { hostRouter } = require('./routes/hostRouter');
const { authRouter } = require('./routes/authRouter');
const hostController = require('./controller/hostController');
const rootDir = require('./utils/pathUtils');

app.get('/uploads/:filename', hostController.serveUploadedHomeImage);

app.use(express.static(path.join(rootDir, 'public')));
app.use(express.static('public'));

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not configured.');
}

const sessionStore = new PostgresSessionStore({
  ttlMs: 7 * 24 * 60 * 60 * 1000,
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  },
}));

app.use((req, res, next) => {
  res.locals.isLoggedIn = Boolean(req.session.isLoggedIn);
  res.locals.user = req.session.user || null;
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(userRouter);
app.use(hostRouter);
app.use(authRouter);

const errorController = require('./controller/errors');
app.use(errorController.error);

const Message = require('./models/Message');
const BuyRequest = require('./models/BuyRequest');

io.on('connection', (socket) => {
  socket.on('joinRoom', (requestId) => {
    socket.join(requestId);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { requestId, message, senderId } = data;
      const buyRequest = await BuyRequest.findById(requestId);

      if (!buyRequest || !senderId) {
        return;
      }

      const sender = senderId;
      const receiver = buyRequest.buyer.toString() === senderId
        ? buyRequest.owner
        : buyRequest.buyer;

      const newMessage = new Message({
        conversation: requestId,
        sender,
        receiver,
        message,
      });

      await newMessage.save();

      io.to(requestId).emit('newMessage', {
        requestId,
        message: newMessage,
      });
    } catch (err) {
      socket.emit('messageError', { error: 'Unable to send message.' });
    }
  });
});

const port = Number(process.env.PORT) || 3004;

initDb()
  .then(() => {
    server.listen(port);
  })
  .catch((error) => {
    console.error('Failed to initialize the database.', error);
    process.exit(1);
  });
