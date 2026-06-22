const path = require('path');
const express = require('express');
const hostRouter = express.Router();

const homeController = require('../controller/hostController');
const buyerController = require('../controller/home');

hostRouter.get('/host/add-home', homeController.getAddHome);

hostRouter.post('/host/add-home', homeController.postAddHome);

hostRouter.get('/host/host-homelist', homeController.getHostHomeList);

hostRouter.post('/host/home-delete/:id', homeController.PostDeleteHome);

hostRouter.get('/host/edit/:id', homeController.getUpdateHome);
hostRouter.post('/host/edit/:id', homeController.PostUpdateHome);

hostRouter.get('/host/buy-requests', homeController.getBuyRequests);
hostRouter.post('/host/buy-request/:id/accept', homeController.acceptBuyRequest);
hostRouter.post('/host/buy-request/:id/reject', homeController.rejectBuyRequest);
hostRouter.post('/host/schedule-meeting', buyerController.scheduleMeeting);

exports.hostRouter = hostRouter;
