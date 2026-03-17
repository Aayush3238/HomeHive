const express = require ('express');
const app = express();
const path = require('path');
// const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require('mongoose');


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
app.use(session ({
    secret:"MySecretKey",
    resave:false,
    saveUninitialized:false,

}));

app.use(express.urlencoded({ extended: true }));
app.use(userRouter);

app.use( hostRouter);

app.use(authRouter);

const errorController = require('./controller/errors');

app.use(errorController.error);

const { MongoConnect } = require('./utils/databaseUtil');


// MongoConnect(() => {
//     app.listen(3003, () => {
//     console.log('Server is running on port 3003');
//     console.log('http://localhost:3003');
//     });   
// });

Mongoose.connect('mongodb+srv://aayushkumar3238_db_user:Ak9891@cluster0.ro9jbct.mongodb.net/airbnb?appName=Cluster0')
.then(() => {
    app.listen(3003, () => {
    console.log('Server is running on port 3003');
    console.log('http://localhost:3003');
    });
})
.catch(err => {
    console.log('Database connection failed:', err.message);
})



