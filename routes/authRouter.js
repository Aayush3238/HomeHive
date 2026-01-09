const express = require('express');
const path = require('path');
const authRouter = express.Router();
const authController = require('../controller/authController');

authRouter.get('/login', authController.getLogin);
authRouter.post('/login', authController.postLogin);

exports.authRouter= authRouter;