const express = require('express');
const path = require('path');
const rootDir = require('../utils/pathUtils');
const Home = require('../models/home');

exports.getAddHome = (req, res, next) => {
    res.render(path.join(rootDir, 'views', 'host/addHome.ejs'));
    isLoggedIn = req.isLoggedIn;
}

const multer = require('multer');
const upload = multer({dest: 'public/uploads/'});
exports.postAddHome = [upload.single('homeImage') ,(req, res)=> {
    console.log(req.body.address);
    const home = new Home (req.body.address, req.body.price, req.file? req.file.filename: null );
    home.save();    
    res.render(path.join(rootDir, 'views', 'host/submitDetails.ejs'));
}];

exports.getHostHomeList = (req, res, next) =>{
    Home.fetchAll()
        .then(SubmittedDetails => {
            res.render('host/host-homelist', {SubmittedDetails});
        })
        .catch(err => {
            console.log("Error fetching homes:", err);
        });
        isLoggedIn = req.isLoggedIn;
        
}

exports.PostDeleteHome =(req, res, next) => {
    const homeId = req.body._id;
    Home.delete(homeId).then(() => {
        res.redirect('/host/host-homelist');
    }).catch(err => {
        console.log("Error deleting home:", err);
        res.redirect('/host/host-homelist');
    });
    isLoggedIn = req.isLoggedIn;
}                 

exports.getUpdateHome = (req, res, next) =>{
    const homeId = req.params.id;
    Home.findById(homeId)
    .then(home => {
        res.render('host/edit', {home});
    })
    .catch(err => {
        console.log("Error finding home:", err);
    });
    isLoggedIn = req.isLoggedIn;
}

exports.PostUpdateHome = (req, res, next) => {
    const homeId = req.body.id;
    const updatedData = {
        address: req.body.address,
        price: req.body.price
    };
    Home.updateHome(homeId, updatedData)
    .then(() => {
        res.redirect("/host/host-homelist");
    })
    .catch(err => {
        console.log("Error updating home:", err);
        res.redirect('/host/host-homelist');
    }); 
}