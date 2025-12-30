const path = require('path');
const express = require('express');
const hostRouter = express.Router();

// const rootDir = require('../utils/pathUtils');

// const multer = require('multer');
// const upload = multer({dest: 'public/uploads/'});

const homeController = require('../controller/hostController');

hostRouter.get('/host/add-home', homeController.getAddHome);

// const SubmittedDetails = [];
// hostRouter.use(express.urlencoded());
hostRouter.post('/host/add-home', homeController.postAddHome);

hostRouter.get('/host/homelist', homeController.getHostHomeList);
// module.exports = hostRouter;
exports.hostRouter = hostRouter;
