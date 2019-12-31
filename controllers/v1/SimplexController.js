/**
 * SimplexController
 *
 */
const { raw } = require('objection');
var moment = require('moment');
var fetch = require('node-fetch');
const v = require('node-input-validator');
const Bluebird = require('bluebird');
fetch.Promise = Bluebird;
var bcrypt = require('bcryptjs');
var aesjs = require('aes-js');
var i18n = require("i18n");
const constants = require('../../config/constants');
// Controllers
var { AppController } = require('./AppController');
// Models
var UsersModel = require('../../models/UsersModel');
var AdminSettings = require('../../models/AdminSetting');
var Coins = require('../../models/Coins');
var SimplexTradeHistory = require('../../models/SimplexTradeHistory');
var KYC = require('../../models/KYC')
var State = require('../../models/State');
var Countries = require('../../models/Countries');
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

    var key = [63, 17, 35, 31, 99, 50, 42, 86, 89, 80, 47, 14, 12, 98, 44, 78]
    var iv = [45, 56, 89, 10, 98, 54, 13, 27, 82, 61, 53, 86, 67, 96, 94, 51]

    // When ready to decrypt the hex string, convert it back to bytes
    var encryptedBytes = aesjs
      .utils
      .hex
      .toBytes(keyValue);

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

      var keyValue = process.env.SIMPLEX_ACCESS_TOKEN;

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
            console.log(err);
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
      var keyValue = process.env.SIMPLEX_ACCESS_TOKEN;

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
      var keyValue = process.env.SIMPLEX_ACCESS_TOKEN;

      var decryptedText = await module
        .exports
        .getKey(keyValue);

      var decryptedWalletId = await module
        .exports
        .getKey(process.env.SIMPLEX_WALLET_ID)

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
              "wallet_id": decryptedWalletId,
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

  async userTradeChecking(user_id) {
    try {
      var country;
      var userKyc = await KYC
        .query()
        .first()
        .where('user_id', user_id)
        .orderBy('id', 'DESC')

      var countryData;
      var stateData;
      var response;
      var msg;
      var sendInfo;

      if (userKyc) {
        if (userKyc.direct_response == null && userKyc.webhook_response == null) {
          response = false;
          msg = 'Your KYC is under process. Please wait until KYC is approved'
        }
        countryData = await Countries
          .query()
          .where('name', userKyc.country)
          .orderBy('id', 'DESC')

        if (countryData != undefined && countryData.length > 0) {

          if (countryData[0].legality == 1) {
            response = true;
            msg = "You are allowed to trade"
          } else if (countryData[0].legality == 4) {
            stateData = await State
              .query()
              .first()
              .where('deleted_at', null)
              .andWhere('name', userKyc.state)
              .orderBy('id', 'DESC');

            if (stateData != undefined) {

              if (stateData.legality == 1) {
                response = true;
                msg = "You are allowed to trade"
              } else {
                response = false;
                msg = 'You are not allowed to trade in this regoin as your state is illegal'

              }
            } else {
              response = false;
              msg = 'You are not allowed to trade in this regoin'
            }
          } else {
            response = false;
            msg = 'You are not allowed to trade in this regoin as country is illegal'
          }
        } else {
          response = false;
          msg = 'You need to complete your KYC to trade in FALDAX';
        }
      } else {
        response = false;
        msg = 'You need to complete your KYC to trade in FALDAX';
      }

      sendInfo = {
        response: response,
        msg: msg
      }
      return (sendInfo);
    } catch (err) {
      console.log(err);
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
        // Checking whether user can trade in the area selected in the KYC 
        var geo_fencing_data = await module.exports.userTradeChecking(user_id);
        if (geo_fencing_data.response == true) {
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

        } else {   // Whatever the response of user trade checking   
          res.json({
            "status": 200,
            "message": geo_fencing_data.msg
          });
        }
      } else {
        return res
          .status(500)
          .json({ "status": 500, "message": ("panic button enabled") })
      }

    } catch (err) {
      console.log(err);
      return res.json({ status: 500, "err": ("Something Wrong") });
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
        // Checking whether user can trade in the area selected in the KYC
        var geo_fencing_data = await module.exports.userTradeChecking(user_id);
        if (geo_fencing_data.response == true) {

          var dataUpdate = await module
            .exports
            .getPartnerDataInfo(main_details);
          if (dataUpdate.is_kyc_update_required == true) {
            var dataObject = {
              "version": 1,
              "partner": "faldax",
              "payment_flow_type": "wallet",
              "return_url_success": process.env.SIMPLEX_SUCCESS_URL,
              "return_url_fail": process.env.SIMPLEX_FAIL_URL,
              "payment_id": payment_id,
              "quote_id": data.quote_id,
              "user_id": user_id,
              "destination_wallet[address]": data.address,
              "destination_wallet[currency]": data.currency,
              "fiat_total_amount[amount]": parseFloat(data.fiat_amount),
              "fiat_total_amount[currency]": data.fiat_currency,
              "digital_total_amount[amount]": parseFloat(data.total_amount),
              "digital_total_amount[currency]": data.currency,
              "action": process.env.SIMPLEX_ACTION_URL
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
              .json({ "status": 200, "message": ("payment details success"), "data": dataObject })
          } else {
            return res
              .status(400)
              .json({ "status": 400, "message": ("payment fail") })
          }

        } else {   // Whatever the response of user trade checking   
          res.json({
            "status": 200,
            "message": (geo_fencing_data.msg)
          });
        }
      } else {
        return res
          .status(500)
          .json({ "status": 500, "message": ("panic button enabled") })
      }

    } catch (err) {
      console.log(err);
      return res.json({ status: 500, "err": ("Something Wrong") });
    }
  }

  async deleteEvent(event_id) {
    try {
      var keyValue = process.env.SIMPLEX_ACCESS_TOKEN;

      var decryptedText = await module
        .exports
        .getKey(keyValue);

      var promise = await new Promise(async function (resolve, reject) {
        await request
          .delete(process.env.SIMPLEX_URL + "events/" + event_id, {
            headers: {
              'Authorization': 'ApiKey ' + decryptedText,
              'Content-Type': 'application/json'
            }
          }, function (err, res, body) {
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
      var data = await module
        .exports
        .getEventData();

      var tradeData = await SimplexTradeHistory
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('trade_type', 3)
        .orderBy('id', 'DESC');

      for (var i = 0; i < tradeData.length; i++) {
        for (var j = 0; j < data.events.length; j++) {
          var payment_data = JSON.stringify(data.events[j].payment);
          payment_data = JSON.parse(payment_data);
          if (payment_data.id == tradeData[i].payment_id && payment_data.status == "pending_simplexcc_payment_to_partner") {
            var feesFaldax = await AdminSettings
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
              .andWhere('user_id', tradeData[i].user_id)
              .orderBy('id', 'DESC');

            if (walletData != undefined) {
              var balanceData = parseFloat(walletData.balance) + (tradeData[i].fill_price)
              var placedBalanceData = parseFloat(walletData.placed_balance) + (tradeData[i].fill_price)
              var walletUpdate = await walletData
                .$query()
                .patch({ balance: balanceData, placed_balance: placedBalanceData });

              var walletUpdated = await Wallet
                .query()
                .first()
                .select()
                .where('coin_id', coinData.id)
                .andWhere('deleted_at', null)
                .andWhere('is_admin', true)
                .andWhere('user_id', 36)
                .orderBy('id', 'DESC');

              if (walletUpdated != undefined) {
                var balance = parseFloat(walletUpdated.balance) + (tradeData[i].fill_price);
                var placed_balance = parseFloat(walletUpdated.placed_balance) + (tradeData[i].fill_price);
                var walletUpdated = await walletUpdated
                  .$query()
                  .patch({ balance: balance, placed_balance: placed_balance })
              }
            }
            // if (tradeData[i].simplex_payment_status == 1) {
            var tradeHistoryData = await SimplexTradeHistory
              .query()
              .select()
              .first()
              .where('id', tradeData[i].id)
              .patch({ simplex_payment_status: 2, is_processed: true });

            await module.exports.deleteEvent(data.events[j].event_id)
            // }
          } else if (payment_data.id == tradeData[i].payment_id) {
            if (payment_data.status == "pending_simplexcc_approval") {
              var tradeHistoryData = await SimplexTradeHistory
                .query()
                .select()
                .first()
                .where('id', tradeData[i].id)
                .patch({ simplex_payment_status: 2, is_processed: true });

              await module.exports.deleteEvent(data.events[j].event_id)
            } else if (payment_data.status == "cancelled") {
              var tradeHistoryData = await SimplexTradeHistory
                .query()
                .select()
                .first()
                .where('id', tradeData[i].id)
                .patch({ simplex_payment_status: 3, is_processed: true });
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