const express = require('express');
const path = require('path');

const rootDir = require('../utils/pathUtils');

const Home  = require('../models/home');

exports.homepage = (req, res) => {
    Home.fetchAll()
    .then(SubmittedDetails => {
        res.render('store/home', {SubmittedDetails, isLoggedIn : req.isLoggedIn});
    })
    .catch(err => {
        console.log("Error fetching homes:", err);
    });
}

exports.getBookings = (req, res, next) =>{
    res.render(path.join(rootDir, 'views', '/store/bookings.ejs'));
    isLoggedIn = req.isLoggedIn;
}

exports.getFavouriteList = (req, res, next)=> {
    res.render(path.join(rootDir, 'views', '/store/favourite-list.ejs'));
    isLoggedIn = req.isLoggedIn;
}

exports.getHomeDetails = (req, res, next) =>{
    const homeId = req.params.id;
    console.log("home id ", homeId);
    Home.findById(homeId)
    .then((home) =>{
        res.render('store/home-details', {home});
    })
    .catch(err =>{
        console.log("home not found");
    });  
    
}
