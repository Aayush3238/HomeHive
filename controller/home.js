const express = require('express');
const path = require('path');

const rootDir = require('../utils/pathUtils');
// let SubmittedDetails = [];

const Home  = require('../models/home');

exports.homepage = (req, res) => {

    // console.log(SubmittedDetails);
    Home.fetchAll((SubmittedDetails) => {
            res.render('store/home', {SubmittedDetails});
    });
    // res.sendFile(path.join(rootDir, 'views', 'home.ejs'));
    // res.render('home', {SubmittedDetails});
    
}




// exports.SubmittedDetails = SubmittedDetails; 

exports.getBookings = (req, res, next) =>{
    res.render(path.join(rootDir, 'views', '/store/bookings.ejs'));
    
}

exports.getFavouriteList = (req, res, next)=> {
    res.render(path.join(rootDir, 'views', '/store/favourite-list.ejs'));
}

exports.getHomeDetails = (req, res, next) =>{
    const homeId = req.params.id;
    console.log("home id ", homeId);
    
    res.render(path.join(rootDir, 'views', '/store/home-details.ejs'));
}
