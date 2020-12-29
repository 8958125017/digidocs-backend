const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let civil = new Schema({

    _id : { type : String },
    certifId: { type : String },
    certifType: { type : String },
    pubBlockaddr: { type : String },
    owner_id : { type : String },
    status : { type : String },
    doc : { type : String },
    cts : { type:Date, default:Date.now },
    data: { type : String }
})

module.exports = mongoose.model('civil',civil);
