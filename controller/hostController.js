const express = require('express');
const path = require('path');

const rootDir = require('../utils/pathUtils');

const Home = require('../models/home');

exports.getAddHome = (req, res, next) => {
    res.render(path.join(rootDir, 'views', 'host/addHome.ejs'));
}

const multer = require('multer');
const upload = multer({dest: 'public/uploads/'});

exports.postAddHome = [upload.single('homeImage') ,(req, res)=> {
    console.log(req.body.address);
    const home = new Home (req.body.address, req.body.price, req.file? req.file.filename: null );
    // SubmittedDetails.push({Address : req.body.address, Price: req.body.price,
    //     HomeImage: req.file? req.file.filename: null

    // });
    home.save();    
    res.render(path.join(rootDir, 'views', 'host/submitDetails.ejs'));
}];

exports.getHostHomeList = (req, res, next) =>{
    Home.fetchAll((SubmittedDetails) => {
        res.render('host/host-homelist', {SubmittedDetails});
    })
}