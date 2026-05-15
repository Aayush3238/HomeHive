const express = require('express');

const userRouter = express.Router();
// const { SubmittedDetails } = require('./hostRouter');
// const { SubmittedDetails } = require('..controller/home');

// const rootDir = require('../utils/pathUtils');
const homeController= require('../controller/home');
userRouter.get('/', homeController.homepage );

userRouter.get('/store/bookings', homeController.getBookings );
userRouter.get('/store/favourite-list', homeController.getFavouriteList );

userRouter.get('/home/:id', homeController.getHomeDetails );
userRouter.post('/favourites/:id', homeController.addToFavourite );
userRouter.post('/buy-request', homeController.createBuyRequest );
userRouter.get('/messages/:requestId', homeController.getMessages);
userRouter.get('/buy-request/:requestId', homeController.getBuyRequest);
userRouter.post('/schedule-meeting', homeController.scheduleMeeting);
module.exports = userRouter;