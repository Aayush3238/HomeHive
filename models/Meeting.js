const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    buyRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BuyRequest',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    scheduledDate: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);