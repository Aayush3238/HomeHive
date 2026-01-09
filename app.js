const express = require ('express');
const app = express();
const path = require('path');


app.set('view engine', 'ejs');
app.set('views', 'views');

const userRouter = require('./routes/userRouter');
const {hostRouter} = require('./routes/hostRouter');
const {authRouter}  = require('./routes/authRouter');
const rootDir = require('./utils/pathUtils');

app.use(express.static(path.join(rootDir, 'public')));
app.use(express.static('public'));
app.use((req, res, next) => {
    console.log(req.url, req.method);
    next();
})
app.use((req,res,next) => {
     req.isLoggedIn = req.cookies ? req.cookies.isloggedIn : false;
     next();
})
app.use(express.urlencoded({ extended: true }));
app.use(userRouter);

app.use( hostRouter);

app.use(authRouter);

const errorController = require('./controller/errors');

app.use(errorController.error);

const { MongoConnect } = require('./utils/databaseUtil');


MongoConnect(() => {
    app.listen(3003, () => {
    console.log('Server is running on port 3003');
    console.log('http://localhost:3003');
    });   
});



