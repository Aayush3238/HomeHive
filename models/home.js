// const {getDB }= require('../utils/databaseUtil');
// const { ObjectId } = require('mongodb');
// module.exports = class Home{
//     constructor(address, price, homeImage, description, _id){
//         this.address = address;
//         this.price = price;
//         this.homeImage = homeImage;
//         this.description = description;
//         if(_id){
//             this._id = new ObjectId(_id);
//         }
//     }
        
//     save(){
//         const db  = getDB();
//         if(this._id){
//             return db.collection('homes').updateOne({_id: this._id}, {$set: this});
//         }else{
//         return db.collection('homes').insertOne(this).then(() => {
//             console.log('Home Added');
//         })
//         }
//     }

//     static fetchAll(){
//         const db = getDB();
//         return db.collection('homes').find().toArray();
//     }

//     static findById(_id){
//         const db = getDB();
//         return db.collection('homes').findOne({_id: new ObjectId(String(_id))});
//     }

//     static delete(_id){
//         const db = getDB();
//         return db.collection('homes').deleteOne({_id: new ObjectId(String(_id))});
//     }

//     static updateHome(_id, updateData){
//         const db= getDB();
//         return db.collection('homes').updateOne({_id: new ObjectId(String(_id))}, {$set: updateData});
//     }
// }

const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
    address:{type:String, required:true},
    price:{type:Number, required:true},
    homeImage:{type:String},
    description:{type:String, required:true}
})

module.exports = mongoose.model('Home', homeSchema);