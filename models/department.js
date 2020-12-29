const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let department = new Schema({

    email: {type:String , unique: true,lowercase:true},
    password: {type:String},
    usernameID : {type:String},
    opsType : {type:String},
    sts : {type:String},
    cts : {type:String},
    uts : {type:String},
    opsMode: { type : String},
    blockaddr : { type : String },
    pubBlockaddr : {type: String},
    departName : {type: String},
    cts : { type:Date, default:Date.now }

})

module.exports = mongoose.model('department',department);
