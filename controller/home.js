const express = require('express');
const path = require('path');
const rootDir = require('../utils/pathUtils');
const Home  = require('../models/home');
const User = require('../models/User')
const BuyRequest = require('../models/BuyRequest');
const Message = require('../models/Message');
const Meeting = require('../models/Meeting');

exports.homepage = (req, res) => {
    Home.find()
    .then(SubmittedDetails => {
        res.render('store/home', {
            SubmittedDetails,
            isLoggedIn: req.session.isLoggedIn,
            user: req.session.user
        });
    })
    .catch(err => {
        console.log("Error fetching homes:", err);
    });
}

exports.getBookings = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const meetings = await Meeting.find({
            participants: req.session.user.id
        })
        .populate('participants', 'firstname lastname')
        .populate('buyRequest')
        .sort({ scheduledDate: 1 });

        res.render(path.join(rootDir, 'views', '/store/bookings.ejs'), { 
            meetings, 
            user: req.session.user,
            isLoggedIn: req.session.isLoggedIn 
        });
    } catch (err) {
        console.log('Error fetching meetings:', err);
        res.status(500).send('Error fetching meetings');
    }
}


exports.getHomeDetails = (req, res, next) =>{
    const homeId = req.params.id;
    console.log("home id ", homeId);
    Home.findById(homeId)
    .then((home) =>{
        res.render('store/home-details', {home, isLoggedIn: req.session.isLoggedIn});
    })
    .catch(err =>{
        console.log("home not found");
    });      
}
exports.getFavouriteList = async (req, res, next)=> {
    if(!req.session.user) {
        res.redirect('/login');
    }
    const userId = req.session.user.id;
    const user = await User.findById(userId).populate('favourites');

    res.render(path.join(rootDir, 'views','/store/favourite-list.ejs' ),
    {favourites: user.favourites,
     isLoggedIn: req.session.isLoggedIn
    }
    )

}
exports.addToFavourite = async (req, res, next) => {
    const userId = req.session.user.id;
    const homeId = req.params.id;
    try {
        await User.findByIdAndUpdate(
            userId,
            {$addToSet: {favourites: homeId}}
        )
        res.redirect('back');
    }
    catch(err){
        console.log("Error adding home to favourites:", err);
      
    }
}

exports.createBuyRequest = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { homeId, offeredPrice, message } = req.body;
    
    try {
        const home = await Home.findById(homeId);
        if (!home) {
            return res.status(404).send('Home not found');
        }

        const buyRequest = new BuyRequest({
            home: homeId,
            buyer: req.session.user.id,
            owner: home.owner,
            offeredPrice: parseFloat(offeredPrice),
            message: message
        });

        await buyRequest.save();
        res.redirect('/');
    } catch (err) {
        console.log('Error creating buy request:', err);
        res.status(500).send('Error creating buy request');
    }
}

exports.getMessages = async (req, res) => {
    const { requestId } = req.params;
    
    try {
        const messages = await Message.find({ conversation: requestId })
            .populate('sender', 'firstname lastname')
            .sort({ createdAt: 1 });
        
        res.json(messages);
    } catch (err) {
        console.log('Error fetching messages:', err);
        res.status(500).json({ error: 'Error fetching messages' });
    }
}

exports.scheduleMeeting = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { requestId, scheduledDate, location, notes } = req.body;
    
    try {
        const buyRequest = await BuyRequest.findById(requestId);
        if (!buyRequest) {
            return res.status(404).send('Buy request not found');
        }

        const meeting = new Meeting({
            buyRequest: requestId,
            participants: [buyRequest.buyer, buyRequest.owner],
            scheduledDate: new Date(scheduledDate),
            location: location,
            notes: notes
        });

        await meeting.save();
        res.redirect('/store/bookings');
    } catch (err) {
        console.log('Error scheduling meeting:', err);
        res.status(500).send('Error scheduling meeting');
    }
};