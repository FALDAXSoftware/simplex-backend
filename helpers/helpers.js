/* Common functions which can be used anywhere */
// var fcmConfig = require('../config/fcm');
// var FCM = require('fcm-node');
// var serverKey = fcmConfig.serverKey; //put your server key here
// var fcm = new FCM(serverKey);
// var User = require("../models/users");
// var Setting = require('../models/settings');


// Used for Response Output in JSON Format
var jsonFormat = async ( res, status, message, data, extra="" )=>{
    var output = {
        "status": status,
        "message": message,
        "data": data
    };
    if( extra != "" ){
      output.extra = extra;
    }
    res.status( status );
    return res.json( output );
}

// To Generate Random Alphanumberic String
var randomString = (length)=> {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result;
}

// Send FCM Notification to Device/Web
// SendNotification = async ( user_id, title, body, payload )=>{    
//     return 1;
//     // var fetchUserData = await User
//     //     .query()
//     //     .where("id",user_id)
//     //     .first()
    
//     // var p2p_device_tokens = fetchUserData.p2p_device_tokens;
//     // if( p2p_device_tokens != "" && p2p_device_tokens != null ){
//     //     var message = {
//     //         registration_ids :JSON.parse(p2p_device_tokens),
//     //         notification: {
//     //             title: title, 
//     //             body: body 
//     //         },        
//     //         data: payload
//     //     };
        
//     //     fcm.send(message, function(err, response){
//     //       if (err) {
//     //         return 0;
//     //       } else {
//     //         return 1;
//     //       }
//     //     });
//     // }
// }

// Common Customized Mailer Function to send mail
// SendEmail = async ( res, requestedData )=> {
//     var template = requestedData.template;
//     var email = requestedData.email;
//     var body = requestedData.body;
//     var extraData = requestedData.extraData;
//     var subject = requestedData.subject;
    
//     await res.mailer
//         .send( template, {
//             to: email,
//             subject: process.env.PRODUCT_NAME + ': ' + subject,
//             body: body, 
//             data : extraData,// All additional properties are also passed to the template as local variables.
//             PRODUCT_NAME: process.env.PRODUCT_NAME,
//             SITE_URL: process.env.SITE_URL
//         }, function (err) {
//             if (err) {
//                 return 0;                
//             } else {
//                 return 1;
//             }
//         });
// }

var SendEmail = async ( res, requestedData )=> {
    
    var template = requestedData.template;
    var email = requestedData.email;
    // var body = requestedData.body;
    var extraData = requestedData.extraData;
    var subject = requestedData.subject;   
    
    try{
        await res.mailer
        .send( template, {
            to: email,
            subject: process.env.MAIL_FROM_NAME + ': ' + subject,
            // body: body, 
            data : extraData,// All additional properties are also passed to the template as local variables.
            PROJECT_NAME: process.env.PROJECT_NAME,
            SITE_URL: process.env.SITE_URL
        }, function (err) {
            console.log(err);
            if (err) {
                return 0;                
            } else {
                return 1;
            }
        });
    }catch(err){
        console.log("EMail err:", err);
        return 0; 
    }
}




var FileUpload = ( files, storepath ) =>{
    return new Promise(async (resolve, reject) => {
        var path = require('path');
        var fs = require('fs');
        let image = files;
        let extention = path.extname(image.name)
        let timestamp = new Date().getTime().toString();
        let newImageName = (timestamp+extention);
        
        
        if (!fs.existsSync("public/"+storepath)){
            await fs.mkdirSync("public/"+storepath);
        }
        var newFile =storepath+newImageName;
        await image.mv( "public/"+newFile, function(err) {
            if (err){
                reject(err);
            }else{
                resolve( newFile );
            }                
        });
    });    
}



module.exports = {
  jsonFormat,
  randomString,
  SendEmail,
  FileUpload
}

