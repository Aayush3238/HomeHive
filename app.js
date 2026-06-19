const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const loadEnv = require('./config/loadEnv');
const PostgresSessionStore = require('./db/sessionStore');
const { initDb } = require('./db');
const cryptoRouter = require('./routes/cryptoRouter');
const passport = require('./config/passport');

loadEnv();
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const userRouter = require('./routes/userRouter');
const { hostRouter } = require('./routes/hostRouter');
const { authRouter } = require('./routes/authRouter');
const rootDir = require('./utils/pathUtils');
const {
  FALLBACK_IMAGE_URL,
  getHomeImageUrl,
  getHomeImageSrcSet,
} = require('./utils/homeImage');

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
    secure: isProduction,
    sameSite: 'lax',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.isLoggedIn = Boolean(req.session.isLoggedIn);
  res.locals.user = req.session.user || null;
  res.locals.imageFallbackUrl = FALLBACK_IMAGE_URL;
  res.locals.getHomeImageUrl = getHomeImageUrl;
  res.locals.getHomeImageSrcSet = getHomeImageSrcSet;
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(userRouter);
app.use(hostRouter);
app.use(authRouter);
app.use('/api/crypto', cryptoRouter);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Express error-handling middleware (must have 4 params)
app.use((err, req, res, next) => {

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).render('Error', {
    pageTitle: 'HomeHive | Something went wrong',
    pageDescription: 'An unexpected error occurred.',
    error: isDev ? err.message : undefined,
  });
});
app.get("/health", (req, res) => {
  res.status(200).send("OK");
})

const errorController = require('./controller/errors');
app.use(errorController.error);

const Message = require('./models/Message');
const BuyRequest = require('./models/BuyRequest');
const User = require('./models/User');

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

      // Fetch receiver's public key for encryption
      const receiverUser = await User.findById(receiver);
      if (!receiverUser || !receiverUser.publicKey) {
        socket.emit('messageError', { error: 'Receiver has not set up encryption' });
        return;
      }

      // Encrypt the message
      const cryptoUtils = require('./utils/crypto');
      const encryptedMessage = await cryptoUtils.encryptMessage(message, receiverUser.publicKey);

      const newMessage = new Message({
        conversation: requestId,
        sender,
        receiver,
        message: encryptedMessage, // Store encrypted message
      });

      await newMessage.save();

      io.to(requestId).emit('newMessage', {
        requestId,
        message: {
          ...newMessage,
          // Include a flag to indicate this is encrypted
          encrypted: true
        },
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

    process.exit(1);
  });
