const mongoose = require('mongoose');
const homeSchema = new mongoose.Schema({
    address:{
        houseNo:{type:String, required:true},
        city:{type:String, required:true},
        district:{type:String},
        state:{type:String, required:true},
        country:{type:String, required:true},
        formattedAddress:{type:String, required:true}
    },
    location:{
        type:{
            type:String,
            enum:['Point'],
            default:'Point'
        },
        coordinates:[Number]
    },
    price:{type:String, required:true},
    homeImage:{type:String},
    description:{type:String, required:true},
    owner: {
        type:mongoose.Schema.Types.ObjectId,
        ref : 'User'
    }
}, {timestamps:true})
homeSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Home', homeSchema);