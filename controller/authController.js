const express = require('express');
const path = require('path');
const rootDir = require('../utils/pathUtils');


exports.getLogin = (req,res,next) => {
    res.render('auth/login');
    isLoggedIn = false;

}
exports.postLogin = (req, res, next ) => {
    res.cookie('isloggedIn', true);
    req.isLoggedIn = true;

    res.redirect('/');

}