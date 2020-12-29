const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let land = new Schema({
    curr_owners :{type:Array},
    prev_owners: {type:Array},
    land_add : {type:String},
    state: {type:String},
    country: {type:String},
    postal_code: {type:String},
    geo_indecies: {type:String},
    land_area: {type:String},
    land_uniq_id: {type:String, unique: true},
    auth_by: {type:String},
    status: {type:String},
    land_status: {type:String},
    parent_land_id: {type:String},
    docs: {
      plot_map: {type:String},
      blue_print: {type:String},
      reg_paper: {type:String},
      stamp_paper: {type:String}
    },
    pubBlockaddr : {type: String},
    cts : { type:Date, default:Date.now }
    
})

module.exports = mongoose.model('land',land);
