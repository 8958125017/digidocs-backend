const async = require('async');
const _ = require('underscore');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const saltRounds = 10
const admin = require('../models/admin');
const config = require('../helpers/config')
const Helpers = require('../helpers/helper')
const department = require('../models/department');
const land = require('../models/land');
const owner = require('../models/owner');

const multichain = require('../helpers/multichain')
const multichainCredential = config.credentials;

async function signup (req,res){
    console.log('[success][admin][signup]: Request params --> ', req.body);
    if (!req.body.email) return res.send({statusCode:400,message:"Email Id is missing."});
    if (!req.body.departName) return res.send({statusCode:400,message:"deapartment name is missing."});
    if (!req.body.opsType) return res.send({statusCode:400,message:"Operation type is missing."});
    if (!req.body.opsMode) return res.send({statusCode:400,message:"Operation mode is missing."});
    req.body.pubBlockaddr=config.adminAddress;
    req.body["sts"]="A"
    try{
      let password = "depart@123";
      // let password = Helpers.genratePassword();
      let hashPassword = await Helpers.hashPasswordfn(password);
      req.body["password"] = hashPassword;
      req.body["plainTextPass"] = password;
      req.body["blockaddr"] = await multichain.getNewAddressandpermissionOnMultichain();
      let mdata = await department.create(req.body);
      delete req.body.plainTextPass
      delete req.body.password
      let publish = await multichainCredential.publishFrom({
                    from:config.adminAddress,
                    stream:"department",
                    key:req.body.blockaddr,
                    data: {"json":req.body}
                  })
     //  var sendMailData = {
     //    orgName: req.body.departName,
     //    email: req.body.email,
     //    password: password
     //  }
     //  const output1 = require('../helpers/mailContent/approval_mail_with_password.js').approvalMailWithPassword(sendMailData);
     //  var mailOptions = {
					// 	from: config.noreplyemail,
					// 	to: req.body.email,
					// 	subject: 'Your Account Details',
					// 	html: output1
					// };
     //  await Helpers.sendMail(mailOptions)

      return res.send({statusCode:200,message:"Department has been Successfully registered."})
      console.log('[success][admin][signup]: Request blockaddr --> ',publish);
    }
    catch(err)
    {
      console.log('[error][department][signup]: error --> ', err);
      return res.send({statusCode:500,message:"Something went wrong."});
    }
 }

async function getapi (req,res){
   try{
     let get = await department.find(req.body);
     return res.send({statusCode:200,message:"Data fetch Successfully.",data:get})
   }
   catch(err)
   {

   }

}
async function departlogin (req,res){
  if (!req.body.email) return res.send({statusCode:400,message:"Email Id is missing."});
  if (!req.body.password) return res.send({statusCode:400,message:"Password is missing."});
  if (!req.body.opsType) return res.send({statusCode:400,message:"opsType is missing."});
  if (!req.body.opsMode) return res.send({statusCode:400,message:"Password is missing."});
  let hashPassword = await Helpers.hashPasswordfn(req.body.password);
  console.log(req.body)
  console.log(hashPassword)
  try{
    let user = await department.findOne({email:req.body.email, opsType: req.body.opsType,  opsMode: req.body.opsMode});
    console.log(user);
    if(user == null) return res.send({ statusCode: 404, message: "The email address that you've entered doesn't match any account" })
    // if(user == null) return res.send({ statusCode: 404, message: "The email address that you've entered doesn't match any account" })
    bcrypt.compare(req.body.password, user.password, async function (err, match) {
      console.log("[success][admin][login] : ", err, match)
      if (err)  return res.send({statusCode:500,message:"Something went wrong."});
      if (!match) return res.send({statusCode: 500,message: "The password that you've entered is incorrect."})
      return res.send({statusCode:200,message:"Login Successfully.",data:user});
    })
  }
  catch(err)
  {
    console.log('[error][department][login]: error --> ', err);
    return res.send({statusCode:500,message:"Something went wrong."});
  }
}

async function registerLand (req,res){
  // if (!req.body.email) return res.send({statusCode:400,message:"email not provided"})
	console.log("req::::", req.body)
  let owners = JSON.parse(req.body.curr_owners)
  if (!req.body.opsType) return res.send({statusCode:400,message:"Department segement not provide"})
  if (!req.body.opsMode) return res.send({statusCode:400,message:"Mode of operation on provided"})
  if (!req.body.pubBlockaddr) return res.send({statusCode:400,message:"publisher address not provided"})
  if (owners.length<1) return res.send({statusCode:400,message:"Owner not provided"})
  if (!req.body.land_add) return res.send({statusCode:400,message:"Land address not provided"})
  if (!req.files.plot_map) return res.send({statusCode:400,message:"Plot map missing"})
  if (!req.files.blue_print) return res.send({statusCode:400,message:"Land Blue print missing"})
  if (!req.files.reg_paper) return res.send({statusCode:400,message:"Land Registration paper missing"})
  if (!req.files.stamp_paper) return res.send({statusCode:400,message:"Stamp paper missing"})
  let plot_map_path = "./files/plot_map/"+req.files.plot_map.name
  let blue_print_path = "./files/blue_print/"+req.files.blue_print.name
  let reg_paper_path = "./files/reg_paper/"+req.files.reg_paper.name
  let stamp_paper_path = "./files/stamp_paper/"+req.files.stamp_paper.name
  req.files.plot_map.mv(plot_map_path)
  req.files.blue_print.mv(blue_print_path)
  req.files.reg_paper.mv(reg_paper_path)
  req.files.stamp_paper.mv(stamp_paper_path)
//  let owners = JSON.parse(req.body.curr_owners)
  let curr_owners =[]
  let keys =[]

  //check all owners if they are registered or not
  // if not registred register
  async.each(owners,async (element,cb)=>{
    if (!element.govt_id){
      return res.send({statusCode:400,message:"Govt Id missing"})
    }
    curr_owners.push(element.govt_id)
    keys.push(element.govt_id)
    multichain.listStreamsKeyItem({stream:"owners",key:element.govt_id}, async (result)=>{
      if(!result) {
        console.log("result else",result)
        let address = await multichain.getNewAddressandpermissionOnMultichain();
        element["blockaddr"] = address
        element["pubBlockaddr"] = req.body.pubBlockaddr
        let omdata = await owner.create(element);
        let publish = await multichainCredential.publishFrom({
          from:req.body.pubBlockaddr,
          stream:"owners",
          key:element.govt_id,
          data: {"json":element}
        }, (err, result)=>{
          // if(err) res.send({statusCode:400,message:"Error occured while publishing owner", data:err})
          if(err) console.log("error",err)
          else{
            console.log("\nowner",JSON.stringify(result))
          }
        })
      }
        // res.send({'responseCode':500,'responseMessage':'Something went wrong',error:err})
      else{

          console.log("\nresult",JSON.stringify(result))

      }
    })
  })

  // //check if parent land exist or not
  // multichain.listStreamsKeyItem({stream:"land",key:req.body.parent_land_id}, async (err,result)=>{
  //   if(!result)
  //     res.send({'responseCode':500,'responseMessage':'Something went wrong',error:err})
  //   else{
  //     if(result[0]){

  //     }
  //     else{
  //       res.send({'responseCode':500,'responseMessage':'Land does not exist'})

  //     }
  //   }
  // })

  let publishData = {
    curr_owners :curr_owners,
    prev_owners: JSON.parse(req.body.prev_owners),
    land_add : req.body.land_add,
    state: req.body.state,
    country: req.body.country,
    postal_code: req.body.postal_code,
    geo_indecies: req.body.geo_indecies,
    land_area: req.body.land_area,
    land_uniq_id: req.body.land_uniq_id,
    auth_by: req.body.auth_by,
    status: "issued",
    land_status: "active",
    parent_land_id: req.body.parent_land_id,
    docs: {
      plot_map: plot_map_path,
      blue_print: blue_print_path,
      reg_paper: reg_paper_path,
      stamp_paper: stamp_paper_path
    }
  }
  console.log("docs",publishData)
  let mdata = await land.findOneAndUpdate({land_uniq_id:publishData.land_uniq_id}, publishData,{upsert:true, new:true}, async (err,result)=>{
    if(err) return res.send({statusCode:400,message:"error in inserting doc", data : err})
    delete publishData["docs"]

    // keys.push(curr_owners)
    keys.push(req.body.land_uniq_id)
    keys.push(req.body.parent_land_id)

    let publish = await multichainCredential.publishFrom({
      from: req.body.pubBlockaddr,
      stream:"land",
      key: keys,
      data: {"json":req.body}
    }, (err, result)=>{
      console.log(keys)
      if(err) res.send({statusCode:400,message:"Error occured while publishing land", data:err})
      else{
        console.log("land registrer success", JSON.stringify(result))
        return res.send({statusCode:200,message:"Land registered Successfully"})
      }
    })

  });

}

async function getIssuedLand (req,res){
  if (!req.body.land_uniq_id) return res.send({statusCode:400,message:"Land ID not provide"})
  if (!req.body.status) return res.send({statusCode:400,message:"Status not provide"})
  land.find({land_uniq_id:req.body.land_uniq_id,status: req.body.status}, (err, result)=>{
    if (err) return res.send({statusCode:400,message:"Error occured while publishing land", data:err})
    if (result){
      return res.send({statusCode:200,message:"Land record found", data:result})
    }
    else{
      return res.send({statusCode:200,message:"No data found"})
    }
  })

}

async function validateLand (req,res){
  if (!req.body.land_uniq_id) return res.send({statusCode:400,message:"Land ID not provide"})
  if (!req.body.pubBlockaddr) return res.send({statusCode:400,message:"Publisher address not provide"})
  if (!req.body.curr_owners) return res.send({statusCode:400,message:"Current oweners not provide"})
  if (!req.body.parent_land_id) return res.send({statusCode:400,message:"Parent land ID not provide"})
  if (!req.body.status) return res.send({statusCode:400,message:"status not provide"})
  let keys = req.body.curr_owners +","+req.body.land_uniq_id+","+req.body.parent_land_id
  
  land.findOne({land_uniq_id:req.body.land_uniq_id}, async (err, result)=>{
    if(err) return res.send({statusCode:500,message:"Error occured while validating land", data: err})

    else if(result.status=='issued'){
      let publishData = {
        curr_owners :result.curr_owners,
        prev_owners: result.prev_owners,
        land_add : result.land_add,
        state: result.state,
        country: result.country,
        postal_code: result.postal_code,
        geo_indecies: result.geo_indecies,
        land_area: result.land_area,
        land_uniq_id: result.land_uniq_id,
        auth_by: result.auth_by,
        status: req.body.status,
        land_status: "active",
        parent_land_id: result.parent_land_id
      }
      let publish = await multichainCredential.publishFrom({
        from: req.body.pubBlockaddr,
        stream:"land",
        key: keys,
        data: {"json":publishData}
      }, (puberr, pubresult)=>{
        if(puberr) return res.send({statusCode:400,message:"Error occured while publishing land", data:puberr})
        else{
          console.log("pubresult", pubresult)
          land.findOneAndUpdate({land_uniq_id:req.body.land_uniq_id, status: "issued"}, {status: req.body.status},{upsert:true}, (dberr, dbresult)=>{
            if(dberr) return res.send({statusCode:500,message:"Error occured while validating land", data: dberr})
            else {
              return res.send({statusCode:200,message:"Land "+ req.body.status+" Successfully"})
            }
          })
        }
        
      })
    }
    else return res.send({statusCode:400,message:"Land is "+result.status})
  })
  

}

async function getallLandbyStatus (req,res){

  //if (!req.body.status) return res.send({statusCode:400,message:"Status not provide"})

  land.find({}, (err, result)=>{
    if (err) return res.send({statusCode:400,message:"Error occured while fetching land", data:err})
    if (result){
      return res.send({statusCode:200,message:"Land records found", data:result, count:result.length})
    }
    else{
      return res.send({statusCode:200,message:"No data found", data:result})
    }
  })
}

async function getOwnerdetailsOfLand (req,res){
  if (!req.body.owners) return res.send({statusCode:400,message:"Owners not provided"})
  let ownersData=[]
  async.each(owners,async (element,cb)=>{
    await owner.findOne({govt_id:req.body.govt_id}, (err, result)=>{
      if(err) return res.send({statusCode:400,message:"Error occured while publishing land", data:err})
      ownersData.push(result)

    })
  })
}
exports.signup=signup;
exports.departlogin=departlogin;
exports.registerLand=registerLand;
exports.getIssuedLand=getIssuedLand;
exports.validateLand=validateLand;
exports.getallLandbyStatus=getallLandbyStatus;
