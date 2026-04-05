const express = require('express');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstname: {type: String, required: true},
    lastname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String, enum: ['Owner', 'Buyer'], required: true},
    favourites: [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref: 'Home'
        }
    ]
});

module.exports = mongoose.model('User', UserSchema);
