const express = require('express');
const path = require('path');
const rootDir = require('../utils/pathUtils');
const Home = require('../models/home');


exports.getAddHome = (req, res, next) => {
    res.render(path.join(rootDir, 'views', 'host/addHome.ejs'));
    isLoggedIn = req.session.isLoggedIn;
}

const multer = require('multer');
const upload = multer({dest: 'public/uploads/'});
exports.postAddHome = [upload.single('homeImage') ,(req, res)=> {
    console.log(req.body.address);
    const home = new Home ({address: req.body.address, price: req.body.price, homeImage: req.file? req.file.filename: null, description: req.body.description });
    home.save();    
    res.render(path.join(rootDir, 'views', 'host/submitDetails.ejs'));
}];

exports.getHostHomeList = (req, res, next) =>{
    Home.find()
        .then((SubmittedDetails) => {
            res.render('host/host-homelist', {SubmittedDetails, isLoggedIn :req.session.isLoggedIn});
        })
        .catch(err => {
            console.log("Error fetching homes:", err);
        });
        
        
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
    // Home.delete(homeId).then(() => {
    //     res.redirect('/host/host-homelist');
    //     isLoggedIn = req.session.isLoggedIn;
    // }).catch(err => {
    //     console.log("Error deleting home:", err);
    //     res.redirect('/host/host-homelist');
    // });             

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
    // const {homeId, address, price, description} = req.body;
    // Home.findById(homeId)
    // .then((home) => {                                      
    //     if(!home) {
    //         return res.status(404).send('Home not found');
    //     }

    //    home.address = address;
    //    home.price = price;
    //    home.description = description;  
    //    return home.save(); 
    // })
    // .then(() => {
    //     res.redirect('/host/host-homelist');
    // })
    // .catch(err => {
    //     console.log("Error updating home:", err);
    // })


// const homeId = req.body.id;
    // const updatedData = {
    //     address: req.body.address,
    //     price: req.body.price,
    //     description: req.body.description
    // };
    // Home.updateHome(homeId, updatedData)
    // .then(() => {
    //     res.redirect("/host/host-homelist");
    //     isLoggedIn = req.session.isLoggedIn;
    // })
    // .catch(err => {
    //     console.log("Error updating home:", err);
    //     res.redirect('/host/host-homelist');
    // }); 