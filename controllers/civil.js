const async = require('async');
const _ = require('underscore');
const civil = require('../models/civil');
const config = require('../helpers/config')
const Helpers = require('../helpers/helper')
const multichain = require('../helpers/multichain')
const multichainCredential = config.credentials;
const owner = require('../models/owner');

async function register (req,res) {
    console.log('[success][civil][register]: Request params --> ', req.body);
    if (!req.body.certifId) return res.send({statusCode:400,message:"Certificate Id is missing."});
    if (!req.body.certifType) return res.send({statusCode:400,message:"Certificate type is missing."});
    if (!req.body.issueraddress) return res.send({statusCode:400,message:"Issuer address is missing."});
    if (!req.body.govt_id) return res.send({statusCode:400,message:"Owner Id is missing."});
    let oresp= await isOwnerRegister(req.body.govt_id);
    if(oresp!=false) req.body["owneraddress"]=oresp;
    else {
      let regresp = await registerOwner(req.body);
      req.body["owneraddress"]=regresp
      }
      let docpath="./files/civil/"+req.body.certifType+"/"+req.files.doc.name
      req.files.doc.mv(docpath);
      req.body["_id"]=req.body.certifId;
      req.body["sts"]=req.body.sts
      try{
        let publish = await multichainCredential.publishFrom({
                      from:req.body.issueraddress,
                      stream:"civil",
                      key:[req.body.certifId,req.body.owneraddress],
                      data: {"json":req.body}
                    })
        req.body["doc"]=docpath;
        let mdata = await civil.create(req.body);
        return res.send({statusCode:200,message:"Department has been Successfully registered."})
        console.log('[success][civil][register]: Request blockaddr --> ',publish);
      }
      catch(err)
      {
        console.log('[error][civil][register]: error --> ', err);
        return res.send({statusCode:500,message:"Something went wrong."});
      }

 }

 async function isOwnerRegister(govt_id){
   return new Promise( async (resolve, reject)=>{
     multichain.listStreamsKeyItem({stream:"owners",key:govt_id}, async (result)=>{
       if(!result) {
         resolve(false);
       }
       else{
         resolve(result.blockaddr)
       }
     })
   })
 }

 async function registerOwner(data){
   return new Promise( async (resolve, reject)=>{
     let address = await multichain.getNewAddressandpermissionOnMultichain();
     let obj={
       name: data.name,
       father_name: data.father_name,
       mother_name: data.mother_name,
       govt_id: data.govt_id,
       mob_num: data.mob_num,
       curr_add: data.curr_add,
       state: data.state,
       country: data.country,
       postal_code: data.postal_code,
       email: data.email,
       password: data.password,
       sts : data.sts,
       blockaddr : address,
       pubBlockaddr : data.issueraddress,
     }
     let publish = await multichainCredential.publishFrom({
                   from:data.issueraddress,
                   stream:"owners",
                   key:data.govt_id,
                   data: {"json":obj}
                 })
      let mdata = await owner.create(obj);
      resolve(address);
   })
 }

 async function registerCivil (req,res){
  req.body["owners"]= JSON.parse(req.body.owners)
  if (!req.body.opsType) return res.send({statusCode:400,message:"Department segement not provide"})
  if (!req.body.opsMode) return res.send({statusCode:400,message:"Mode of operation on provided"})
  if (!req.body.pubBlockaddr) return res.send({statusCode:400,message:"publisher address not provided"})
  if (!req.body.owners || !req.body.owners.govt_id) return res.send({statusCode:400,message:"Owner not provided"})
  if (!req.body.certifId) return res.send({statusCode:400,message:"certifId not provided"})
  if (!req.files.doc) return res.send({statusCode:400,message:"Doc paper missing"})
  if (!req.body.data) return res.send({statusCode:400,message:"data missing"})

  let certiDoc = "./files/civil/"+ req.files.doc.name
  req.files.doc.mv(certiDoc)
  let owner = req.body.owners
  // console.log("owners:::::::::::::::",owner)
  multichain.listStreamsKeyItem({stream:"owners",key:owner.govt_id}, async (result)=>{
    if(!result) {
      let address = await multichain.getNewAddressandpermissionOnMultichain();
      owner["blockaddr"] = address
      owner["pubBlockaddr"] = req.body.pubBlockaddr
      let omdata = await owner.create(owner);
      let publish = await multichainCredential.publishFrom({
        from:req.body.pubBlockaddr,
        stream:"owners",
        key:owner.govt_id,
        data: {"json":owner}
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
  let publishData = {
    owner_id :owner.govt_id,
    certifId : req.body.certifId,
    certifType : req.body.certifType,
    pubBlockaddr: req.body.pubBlockaddr,
    status: "issued",
    docs: {
      doc: certiDoc
    },
    data: req.body.data
  }
  let keys = []
  let mdata = await civil.findOneAndUpdate({certifId:publishData.certifId}, publishData,{upsert:true, new:true}, async (err,result)=>{
    if(err) return res.send({statusCode:400,message:"error in inserting doc", data : err})
    delete publishData["docs"]
    // delete publishData["owner"]
    // keys.push(curr_owners)
    keys.push(owner.govt_id)
    keys.push(req.body.certifId)
    keys.push(req.body.certifType)
    let publish = await multichainCredential.publishFrom({
      from: req.body.pubBlockaddr,
      stream:"civil",
      key: keys,
      data: {"json":publishData}
    }, (err, result)=>{
      console.log(keys)
      if(err) res.send({statusCode:400,message:"Error occured while publishing land", data:err})
      else{
        console.log("Civil registrer success", JSON.stringify(result))
        return res.send({statusCode:200,message:"Certificate registered Successfully"})
      }
    })
  })
 }

async function getIssuedCertificate (req,res){
  if (!req.body.certifId) return res.send({statusCode:400,message:"certifId not provide"})
  if (!req.body.status) return res.send({statusCode:400,message:"Status not provide"})
  civil.find({certifId:req.body.certifId,status: req.body.status}, (err, result)=>{
    if (err) return res.send({statusCode:400,message:"Error occured while publishing civil", data:err})
    if (result){
      return res.send({statusCode:200,message:"Civil certificate record found", data:result})
    }
    else{
      return res.send({statusCode:200,message:"No data found"})
    }
  })

}

async function validateCivil (req,res){
  if (!req.body.certifId) return res.send({statusCode:400,message:"certifId not provide"})
  if (!req.body.pubBlockaddr) return res.send({statusCode:400,message:"Publisher address not provide"})
  if (!req.body.certifType) return res.send({statusCode:400,message:"certifType not provide"})
  if (!req.body.owner) return res.send({statusCode:400,message:"Oweners not provide"})
  let keys = req.body.owner +","+req.body.certifId+","+req.body.certifType
  
  civil.findOne({certifId:req.body.certifId}, async (err, result)=>{
    if(err) return res.send({statusCode:500,message:"Error occured while validating civil", data: err})

    else if(result.status=='issued'){
      let publishData = {
        owner_id :result.owner,
        certifId : req.body.certifId,
        certifType : req.body.certifType,
        pubBlockaddr: req.body.pubBlockaddr,
        status: req.body.status,
        data: result.data
      }
      let publish = await multichainCredential.publishFrom({
        from: req.body.pubBlockaddr,
        stream:"civil",
        key: keys,
        data: {"json":publishData}
      }, (puberr, pubresult)=>{
        if(puberr) return res.send({statusCode:400,message:"Error occured while publishing civil", data:puberr})
        else{
          console.log("pubresult", pubresult)
          civil.findOneAndUpdate({certifId:req.body.certifId, status: "issued"}, {status: req.body.status},{upsert:true}, (dberr, dbresult)=>{
            if(dberr) return res.send({statusCode:500,message:"Error occured while validating civil", data: dberr})
            else {
              return res.send({statusCode:200,message:"Certificate "+ req.body.status+" Successfully"})
            }
          })
        }
        
      })
    }
    else return res.send({statusCode:400,message:"Certificate is "+result.status})
  })
  

}

async function getallCivilbyType (req,res){

  //if (!req.body.status) return res.send({statusCode:400,message:"status not provide"})
  if (!req.body.certifType) return res.send({statusCode:400,message:"Certificate Type not provide"})

  civil.find({ certifType:req.body.certifType}, (err, result)=>{
    if (err) return res.send({statusCode:400,message:"Error occured while fetching civil", data:err})
    if (result){
      return res.send({statusCode:200,message:req.body.certifType+" records found", data:result, count:result.length})
    }
    else{
      return res.send({statusCode:200,message:"No data found", data:result})
    }
  })
}

async function getIssuedCertificate (req,res){
  if (!req.body.certifId) return res.send({statusCode:400,message:"certifId not provide"})
  if (!req.body.status) return res.send({statusCode:400,message:"Status not provide"})
  if (!req.body.certifType) return res.send({statusCode:400,message:"Status not provide"})
  civil.find({land_uniq_id:req.body.land_uniq_id,status: req.body.status}, (err, result)=>{
    if (err) return res.send({statusCode:400,message:"Error occured while fetching certificate", data:err})
    if (result){
      return res.send({statusCode:200,message:req.body.certifType+" records found", data:result})
    }
    else{
      return res.send({statusCode:200,message:"No data found"})
    }
  })

}
 exports.register=register;
 exports.registerCivil=registerCivil;
 exports.validateCivil=validateCivil;
 exports.getallCivilbyType=getallCivilbyType;
 exports.getIssuedCertificate=getIssuedCertificate;
