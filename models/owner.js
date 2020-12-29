const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let owner = new Schema({
    name: {type:String},
    father_name: {type:String},
    mother_name: {type:String},
    govt_id: {type:String, unique:true},
    mob_num: {type:String},
    curr_add: {type:String},
    state: {type:String},
    country: {type:String},
    postal_code: {type:String},
    email: {type:String ,lowercase:true},
    password: {type:String},
    sts : {type:String},
    blockaddr : { type : String },
    pubBlockaddr : {type: String},
    cts : { type:Date, default:Date.now }
    
})

module.exports = mongoose.model('owner',owner);
