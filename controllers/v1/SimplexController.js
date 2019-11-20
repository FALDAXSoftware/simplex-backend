/**
 * SimplexController
 * 
 */
const {
  raw
} = require('objection');
var moment = require('moment');
var fetch = require('node-fetch');
const v = require('node-input-validator');
const Bluebird = require('bluebird');
fetch.Promise = Bluebird;
var bcrypt = require('bcryptjs');
var aesjs = require('aes-js');
var i18n = require("i18n");
// Extra
var Helper = require("../../helpers/helpers");
const constants = require('../../config/constants');
// Controllers
var {
  AppController
} = require('./AppController');
// Models
var UsersModel = require('../../models/v1/UsersModel');
var requestIp = require('request-ip');
const uuidv1 = require('uuid/v1');
var request = require('request')
var logger = require("./logger")
const iplocation = require("iplocation").default;


/**
 * Users
 * It's contains all the opration related with users table. Like userList, userDetails,
 * createUser, updateUser, deleteUser and changeStatus
 */
class SimplexController extends AppController {

  constructor() {
    super();

  }

  // Used to get user profile
  async getLatitude(ip) {
    var value = await iplocation(ip);
    return value;
  }

  // Used to get user lists
  async getUserQouteDetails(req, res) {
    try {
      var data = req.body;
      var ip = requestIp.getClientIp(req);
      var user_id = req.session.user_id;
      data.client_ip = ip;
      data.end_user_id = user_id;

      var panic_button_details = await AdminSetting.findOne({
        where: {
          deleted_at: null,
          slug: 'panic_status'
        }
      });

      // Checking for if panic button in one or not
      if (panic_button_details.value == false || panic_button_details.value == "false") {
        //Checking whether user can trade in the area selected in the KYC
        // var geo_fencing_data = await sails
        //   .helpers
        //   .userTradeChecking(user_id);


        // if (geo_fencing_data.response == true) {
        var qouteDetail = await sails.helpers.simplex.getQouteDetails(data);
        var coinDetails = await Coins.findOne({
          where: {
            deleted_at: null,
            coin: data.digital_currency,
            is_active: true
          }
        })

        var createMsg = '';
        var walletDetails = await Wallet.findOne({
          where: {
            deleted_at: null,
            user_id: user_id,
            coin_id: coinDetails.id
          }
        })

        if (walletDetails == undefined) {
          createMsg = 'Please create you address to continue'
        }
        return res
          .status(200)
          .json({
            "status": 200,
            "message": sails.__("qoute details success"),
            "data": qouteDetail,
            walletDetails,
            createMsg,
            coinDetails
          });

        // } else {
        //   // Whatever the response of user trade checking
        //   res.json({
        //     "status": 200,
        //     "message": sails.__(geo_fencing_data.msg)
        //   });
        // }
      } else {
        return res
          .status(500)
          .json({
            "status": 500,
            "message": sails.__("panic button enabled")
          })
      }

    } catch (err) {
      console.log(err);
      await logger.error(err.message)
      return res.json({
        status: 500,
        "err": sails.__("Something Wrong")
      });
    }
  }
}


module.exports = new SimplexController();