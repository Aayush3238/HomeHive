const express = require ('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', 'views');



userRouter = require('./routes/userRouter');
const {hostRouter} = require('./routes/hostRouter');
const rootDir = require('./utils/pathUtils');

app.use(express.static(path.join(rootDir, 'public')));
app.use(express.static('public'));
app.use((req, res, next) => {
    console.log(req.url, req.method);
    next();
})
app.use(express.urlencoded());
app.use(userRouter);
app.use(hostRouter);

const errorController = require('./controller/errors');

app.use(errorController.error);
app.listen(3003, () => {
    console.log('Server is running on port 3003');
    console.log('http://localhost:3003');
})