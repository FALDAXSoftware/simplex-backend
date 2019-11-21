/**
 * SimplexController
 *
 */
const {raw} = require('objection');
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
var {AppController} = require('./AppController');
// Models
var UsersModel = require('../../models/UsersModel');
var AdminSettings = require('../../models/AdminSetting');
var Coins = require('../../models/Coins');
var SimplexTradeHistory = require('../../models/SimplexTradeHistory');
var Wallet = require('../../models/Wallet');
var requestIp = require('request-ip');
const uuidv1 = require('uuid/v1');
var request = require('request')
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

  async getKey(keyValue) {
    var key = [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16
    ];
    var iv = [
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36
    ]

    // When ready to decrypt the hex string, convert it back to bytes
    var encryptedBytes = aesjs
      .utils
      .hex
      .toBytes(keyValue.value);

    // The output feedback mode of operation maintains internal state, so to decrypt
    // a new instance must be instantiated.
    var aesOfb = new aesjs
      .ModeOfOperation
      .ofb(key, iv);

    var decryptedBytes = aesOfb.decrypt(encryptedBytes);

    // Convert our bytes back into text
    let decryptedText = aesjs
      .utils
      .utf8
      .fromBytes(decryptedBytes);

    return decryptedText
  }

  async getEventData() {
    try {
      var keyValue = await AdminSettings
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('slug', 'access_token')
        .orderBy('id', 'DESC')

      var decryptedText = await module
        .exports
        .getKey(keyValue);

      var promise = await new Promise(async function (resolve, reject) {
        await request
          .get(process.env.SIMPLEX_URL + 'events', {
            headers: {
              'Authorization': 'ApiKey ' + decryptedText,
              'Content-Type': 'application/json'
            }
          }, function (err, res, body) {
            resolve(JSON.parse(res.body));
          });
      })

      return promise;

    } catch (error) {
      console.log(error);
    }
  }

  async getPartnerDataInfo(data) {
    try {
      var keyValue = await AdminSettings
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('slug', 'access_token')
        .orderBy('id', 'DESC')

      var decryptedText = await module
        .exports
        .getKey(keyValue);

      var promise = await new Promise(function (resolve, reject) {
        request
          .post(process.env.SIMPLEX_URL + 'payments/partner/data', {
            headers: {
              'Authorization': 'ApiKey ' + decryptedText,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          }, function (err, res, body) {
            resolve(JSON.parse(res.body));
          });
      })
      return promise;
    } catch (err) {
      console.log("Error in rising falling data ::::: ", err);
    }
  }

  async getQouteDetails(data) {
    try {
      var keyValue = await AdminSettings
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('slug', 'access_token')
        .orderBy('id', 'DESC')

      var decryptedText = await module
        .exports
        .getKey(keyValue);

      var promise = await new Promise(async function (resolve, reject) {
        await request
          .post(process.env.SIMPLEX_URL + 'quote', {
            headers: {
              'Authorization': 'ApiKey ' + decryptedText,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              "digital_currency": data.digital_currency,
              "fiat_currency": data.fiat_currency,
              "requested_currency": data.requested_currency,
              "requested_amount": data.requested_amount,
              "end_user_id": (data.end_user_id).toString(),
              "wallet_id": process.env.WALLET_ID,
              "client_ip": (data.client_ip)
            })
          }, async function (err, res, body) {
            res = await res.toJSON();
            resolve(JSON.parse(res.body));
          });
      })
      return promise;
    } catch (err) {
      console.log("Error in rising falling data ::::: ", err);
    }
  }

  // Used to get user lists
  async getUserQouteDetails(req, res) {
    try {
      var data = req.body;
      // var ip = requestIp.getClientIp(req); var user_id = 1545; data.client_ip = ip;
      // data.end_user_id = 1545;
      let user_id = data.end_user_id;
      var panic_button_details = await AdminSettings
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('slug', 'panic_status')
        .orderBy('id', 'DESC')

      // Checking for if panic button in one or not
      if (panic_button_details.value == false || panic_button_details.value == "false") {
        // Checking whether user can trade in the area selected in the KYC var
        // geo_fencing_data = await sails   .helpers   .userTradeChecking(user_id); if
        // (geo_fencing_data.response == true) {
        var qouteDetail = await module
          .exports
          .getQouteDetails(data);

        var coinDetails = await Coins
          .query()
          .first()
          .select()
          .where('deleted_at', null)
          .andWhere('coin', data.digital_currency)
          .andWhere('is_active', true)
          .orderBy('id', 'DESC');

        var createMsg = '';
        var walletDetails = await Wallet
          .query()
          .first()
          .select()
          .where('deleted_at', null)
          .andWhere('user_id', user_id)
          .andWhere('coin_id', coinDetails.id)
          .orderBy('id', 'DESC');

        if (walletDetails == undefined) {
          createMsg = 'Please create you address to continue'
        }
        return res
          .status(200)
          .json({
            "status": 200,
            "message": ("qoute details success"),
            "data": qouteDetail,
            walletDetails,
            createMsg,
            coinDetails
          });

        // } else {   // Whatever the response of user trade checking   res.json({
        // "status": 200,     "message": sails.__(geo_fencing_data.msg)   }); }
      } else {
        return res
          .status(500)
          .json({"status": 500, "message": ("panic button enabled")})
      }

    } catch (err) {
      console.log(err);
      return res.json({status: 500, "err": ("Something Wrong")});
    }
  }

  // Get partner data value on the basis of the information passed by the user
  async getPartnerData(req, res) {
    try {

      var data = req.body;
      var user_id = data.main_details.account_details.app_end_user_id;
      let main_details = data.main_details;
      let payment_id = main_details.transaction_details.payment_details.payment_id;
      // Checking for panic button
      var panic_button_details = await AdminSettings
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('slug', 'panic_status')
        .orderBy('id', 'DESC')

      if (panic_button_details.value == false || panic_button_details.value == "false") {
        // Checking whether user can trade in the area selected in the KYC var
        // geo_fencing_data = await sails   .helpers   .userTradeChecking(user_id); if
        // (geo_fencing_data.response == true) {

        var dataUpdate = await module
          .exports
          .getPartnerDataInfo(main_details);
        if (dataUpdate.is_kyc_update_required == true) {
          var dataObject = {
            "version": 1,
            "partner": "faldax",
            "payment_flow_type": "wallet",
            "return_url_success": process.env.SUCCESS_URL,
            "return_url_fail": process.env.FAIL_URL,
            "payment_id": payment_id,
            "quote_id": data.quote_id,
            "user_id": user_id,
            "destination_wallet[address]": data.address,
            "destination_wallet[currency]": data.currency,
            "fiat_total_amount[amount]": parseFloat(data.fiat_amount),
            "fiat_total_amount[currency]": data.fiat_currency,
            "digital_total_amount[amount]": parseFloat(data.total_amount),
            "digital_total_amount[currency]": data.currency,
            "action": process.env.ACTION_URL
          }
          var now = new Date();

          let tradeHistory = await SimplexTradeHistory
            .query()
            .insert({
              'payment_id': payment_id,
              "quote_id": data.quote_id,
              'currency': data.currency,
              "settle_currency": data.fiat_currency,
              "quantity": parseFloat(data.fiat_amount),
              "user_id": user_id,
              "symbol": data.currency + '-' + data.fiat_currency,
              "side": 'Buy',
              "created_at": now,
              "updated_at": now,
              "fill_price": parseFloat(data.total_amount),
              "price": 0,
              "simplex_payment_status": 1,
              "trade_type": 3,
              "order_status": "filled",
              "order_type": "Market",
              "address": data.address,
              "is_processed": false
            });
          return res
            .status(200)
            .json({"status": 200, "message": ("payment details success"), "data": dataObject})
        } else {
          return res
            .status(400)
            .json({"status": 400, "message": ("payment fail")})
        }

        // } else {   // Whatever the response of user trade checking   res.json({
        // "status": 200,     "message": sails.__(geo_fencing_data.msg)   }); }
      } else {
        return res
          .status(500)
          .json({"status": 500, "message": ("panic button enabled")})
      }

    } catch (err) {
      console.log(err);
      return res.json({status: 500, "err": ("Something Wrong")});
    }
  }

  async deleteEvent(event_id) {
    try {
      var keyValue = await AdminSettings
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('slug', 'access_token')
        .orderBy('id', 'DESC')

      var decryptedText = await module
        .exports
        .getKey(keyValue);

      var promise = await new Promise(async function (resolve, reject) {
        await request
          .delete(sails.config.local.SIMPLEX_URL + "events/" + event_id, {
            headers: {
              'Authorization': 'ApiKey ' + decryptedText,
              'Content-Type': 'application/json'
            }
          }, function (err, res, body) {
            console.log(res.body);
            return (res.body)
          });
      })
      return promise;

    } catch (err) {
      console.log(err);
      await logger.error(err.message)
    }
  }

  async checkPaymentStatus() {
    try {
      console.log("Inside this method????????")
      var data = await module
        .exports
        .getEventData();
      console.log(data);
      var tradeData = await SimplexTradeHistory
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('trade_type', 3)
        .andWhere('simplex_payment_status', 1)
        .andWhere('is_processed', false)
        .orderBy('id', 'DESC');

      for (var i = 0; i < tradeData.length; i++) {
        for (var j = 0; j < data.events.length; j++) {
          var payment_data = JSON.stringify(data.events[j].payment);
          payment_data = JSON.parse(payment_data);
          console.log(payment_data)
          if (payment_data.id == tradeData[i].payment_id && payment_data.status == "pending_simplexcc_payment_to_partner") {
            var feesFaldax = await AdminSetting
              .query()
              .first()
              .select()
              .where('deleted_at', null)
              .andWhere('slug', 'simplex_faldax_fees')
              .orderBy('id', 'DESC')

            var coinData = await Coins
              .query()
              .first()
              .select()
              .where('deleted_at', null)
              .andWhere('is_active', true)
              .andWhere('coin', tradeData[i].currency)
              .orderBy('id', 'DESC');

            var walletData = await Wallet
              .query()
              .first()
              .select()
              .where('coin_id', coinData.id)
              .andWhere('deleted_at', null)
              .andWhere('receive_address', tradeData[i].address)
              .andWhere('user_id',tradeData[i].user_id)
              .orderBy('id','DESC');

            if (walletData != undefined) {
              var balanceData = parseFloat(walletData.balance) + (tradeData[i].fill_price)
              var placedBalanceData = parseFloat(walletData.placed_balance) + (tradeData[i].fill_price)
              var walletUpdate = await walletData
                .$query()
                .patch({balance: balanceData, placed_balance: placedBalanceData});

              var walletUpdated = await Wallet
              .query()
              .first()
              .select()
              .where('coin_id', coinData.id)
              .andWhere('deleted_at', null)
              .andWhere('is_admin', true)
              .andWhere('user_id',36)
              .orderBy('id','DESC');

              if (walletUpdated != undefined) {
                var balance = parseFloat(walletUpdated.balance) + (tradeData[i].fill_price);
                var placed_balance = parseFloat(walletUpdated.placed_balance) + (tradeData[i].fill_price);
                var walletUpdated = await walletUpdated
                  .$query()
                  .patch({balance: balance, placed_balance: placed_balance})
              }
            }
            if (tradeData[i].simplex_payment_status == 1) {
              var tradeHistoryData = await SimplexTradeHistory
                .query()
                .select()
                .first()
                .where('id',tradeData[i].id)
                .patch({simplex_payment_status: 2, is_processed: true});

              console.log(data.events[j].id);
              await module.exports.deleteEvent(data.events[j].event_id)
            }
          } else if (payment_data.id == tradeData[i].payment_id) {
            console.log("ELSE IF >>>>>>>>>>>>>")
            if (payment_data.status == "pending_simplexcc_approval") {
              console.log("IF ????????????")
              var tradeHistoryData = await SimplexTradeHistory
              .query()
              .select()
              .first()
              .where('id',tradeData[i].id)
              .patch({simplex_payment_status: 2, is_processed: true});

              console.log("Deleteing the event in else", data.events[j].event_id)

              await module.exports.deleteEvent(data.events[j].event_id)
            } else if (payment_data.status == "cancelled") {
              var tradeHistoryData = await SimplexTradeHistory
              .query()
              .select()
              .first()
              .where('id',tradeData[i].id)
              .patch({simplex_payment_status: 3, is_processed: true});
              console.log("deleting thsi event further>>>>", data.events[j].event_id);
              await module.exports.deleteEvent(data.events[j].event_id)
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
      await logger.error(err.message)
    }
  }

}

module.exports = new SimplexController();