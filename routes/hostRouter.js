const path = require('path');
const express = require('express');
const hostRouter = express.Router();

const homeController = require('../controller/hostController');

hostRouter.get('/host/add-home', homeController.getAddHome);

hostRouter.post('/host/add-home', homeController.postAddHome);

hostRouter.get('/host/host-homelist', homeController.getHostHomeList);

hostRouter.post('/host/home-delete/:id', homeController.PostDeleteHome);

hostRouter.get('/host/edit/:id', homeController.getUpdateHome);
hostRouter.post('/host/edit/:id', homeController.PostUpdateHome);

exports.hostRouter = hostRouter;
