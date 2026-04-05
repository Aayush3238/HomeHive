const mongoose = require('mongoose');

const buyRequestSchema = new mongoose.Schema({
    home: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home',
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    offeredPrice: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('BuyRequest', buyRequestSchema);