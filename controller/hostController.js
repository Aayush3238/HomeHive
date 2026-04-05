const express = require('express');
const path = require('path');
const rootDir = require('../utils/pathUtils');
const Home = require('../models/home');
const User = require('../models/User');
const BuyRequest = require('../models/BuyRequest');


exports.getAddHome = (req, res, next) => {
    res.render(path.join(rootDir, 'views', 'host/addHome.ejs'));
    isLoggedIn = req.session.isLoggedIn;
}

const multer = require('multer');
const upload = multer({dest: 'public/uploads/'});
exports.postAddHome = [upload.single('homeImage') ,(req, res)=> {
    const formattedAddress = `${req.body.houseNo}, ${req.body.city}, ${req.body.district}, ${req.body.state}, ${req.body.country}`;

    const home = new Home ({address:{
        houseNo:req.body.houseNo,
        city:req.body.city,
        district:req.body.district,
        state:req.body.state,
        country:req.body.country,
        formattedAddress:formattedAddress
    }, 
    location:{
        type: 'Point',
        coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
    },
    price: req.body.price,
    homeImage: req.file? req.file.filename: null,
    description: req.body.description, 
    owner:req.session.user.id });
    home.save()
    .then (() => {
        res.render(path.join(rootDir, 'views', 'host/submitDetails.ejs'));
    })
    .catch(err=> {
        console.log("error in saving the home", err);
    });
    
}];

exports.getHostHomeList = (req, res, next) =>{
    Home.find({owner:req.session.user.id})
        .then((SubmittedDetails) => {
            res.render('host/host-homelist', {SubmittedDetails, isLoggedIn :req.session.isLoggedIn});
        })
        .catch(err => {
            console.log("Error fetching homes:", err);
        });    
}

exports.getBuyRequests = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const buyRequests = await BuyRequest.find({ owner: req.session.user.id })
            .populate('home')
            .populate('buyer')
            .sort({ createdAt: -1 });
        
        res.render('host/buy-requests', { buyRequests, isLoggedIn: req.session.isLoggedIn });
    } catch (err) {
        console.log('Error fetching buy requests:', err);
        res.status(500).send('Error fetching buy requests');
    }
}

exports.acceptBuyRequest = async (req, res) => {
    const requestId = req.params.id;
    
    try {
        await BuyRequest.findByIdAndUpdate(requestId, { status: 'accepted' });
        res.redirect('/host/buy-requests');
    } catch (err) {
        console.log('Error accepting buy request:', err);
        res.status(500).send('Error accepting buy request');
    }
}

exports.rejectBuyRequest = async (req, res) => {
    const requestId = req.params.id;
    
    try {
        await BuyRequest.findByIdAndUpdate(requestId, { status: 'rejected' });
        res.redirect('/host/buy-requests');
    } catch (err) {
        console.log('Error rejecting buy request:', err);
        res.status(500).send('Error rejecting buy request');
    }
}

exports.PostDeleteHome =(req, res, next) => {
    const homeId = req.params.id;
    Home.findByIdAndDelete(homeId)
    .then(() => {
        res.redirect('/host/host-homelist');
    })
    .catch(err => {
        console.log("Error deleting home:", err);
    })
}    

exports.getUpdateHome = (req, res, next) =>{
    const homeId = req.params.id;
    Home.findById(homeId)
    .then(home => {
        res.render('host/edit', {home});
        req.session.isLoggedIn;
    })
    .catch(err => {
        console.log("Error finding home:", err);
    });

}

exports.PostUpdateHome = (req, res, next) => {

    const homeId = req.body.id;
    const updateData = {
        address: req.body.address,
        price : req.body.price,
        description: req.body.description
    };
    Home.findByIdAndUpdate(homeId, updateData)
    .then(() => {
        res.redirect('/host/host-homelist');
    })
    .catch(err => {
        console.log("Error updating home:", err);
    });
}