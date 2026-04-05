const express = require ('express');
const app = express();
const path = require('path');
// const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server);


app.set('view engine', 'ejs');
app.set('views', 'views');

const userRouter = require('./routes/userRouter');
const {hostRouter} = require('./routes/hostRouter');
const {authRouter}  = require('./routes/authRouter');
const rootDir = require('./utils/pathUtils');
const Mongoose = require('mongoose');

app.use(express.static(path.join(rootDir, 'public')));
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(req.url, req.method);
    next();
})
// Session store configuration with fallback
let sessionStore;
try {
    sessionStore = new MongoStore({
        mongoUrl: 'mongodb+srv://aayushkumar3238_db_user:Ak9891@cluster0.ro9jbct.mongodb.net/airbnb?appName=Cluster0',
        touchAfter: 24 * 3600,
        retries: 2,
        mongooseConnection: null
    });
    sessionStore.on('error', (err) => {
        console.warn('MongoDB session store error - using memory store fallback:', err.message);
    });
} catch (err) {
    console.warn('Could not initialize MongoDB session store:', err.message);
    sessionStore = new (require('express-session').MemoryStore)();
}

app.use(session ({
    secret: "MySecretKey",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    }
}));

app.use((req,res,next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn;
    res.locals.user = req.session.user;
    next();
})

app.use(express.urlencoded({ extended: true }));
app.use(userRouter);

app.use( hostRouter);

app.use(authRouter);

const errorController = require('./controller/errors');

app.use(errorController.error);

const { MongoConnect } = require('./utils/databaseUtil');

const mongoOptions = {
    retryWrites: true,
    w: 'majority',
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2
};

// MongoDB Connection with Retry Logic
let mongoConnected = false;

const connectMongo = () => {
    Mongoose.connect('mongodb+srv://aayushkumar3238_db_user:Ak9891@cluster0.ro9jbct.mongodb.net/airbnb?appName=Cluster0', mongoOptions)
        .then(() => {
            mongoConnected = true;
            console.log('✅ MongoDB Connected Successfully');
        })
        .catch(err => {
            mongoConnected = false;
            console.log('⚠️ MongoDB Connection Error:', err.message);
            console.log('⏳ Retrying in 5 seconds...');
            setTimeout(connectMongo, 5000);
        });
};

connectMongo();

// Event listeners for MongoDB connection
Mongoose.connection.on('disconnected', () => {
    mongoConnected = false;
    console.log('⚠️ MongoDB Disconnected');
});

Mongoose.connection.on('error', (err) => {
    console.log('❌ MongoDB Error:', err.message);
    mongoConnected = false;
});

// Start server immediately (don't wait for DB)
server.listen(3004, () => {
    console.log('🚀 Server is running on port 3004');
    console.log('🌐 http://localhost:3004');
});

// Socket.io handling
const Message = require('./models/Message');
const BuyRequest = require('./models/BuyRequest');

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (requestId) => {
        socket.join(requestId);
    });

    socket.on('sendMessage', async (data) => {
        try {
            const { requestId, message } = data;
            const buyRequest = await BuyRequest.findById(requestId);
            
            if (!buyRequest) return;

            // Determine sender and receiver based on socket (simplified - in real app, use session/user data)
            const sender = buyRequest.buyer; // This should be from session
            const receiver = buyRequest.owner; // This should be from session

            const newMessage = new Message({
                conversation: requestId,
                sender: sender,
                receiver: receiver,
                message: message
            });

            await newMessage.save();

            io.to(requestId).emit('newMessage', {
                requestId,
                message: newMessage
            });
        } catch (err) {
            console.log('Error sending message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});



