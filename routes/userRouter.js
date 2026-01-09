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
module.exports = userRouter;