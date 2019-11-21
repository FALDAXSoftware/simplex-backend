/**
 * UsersController
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

var i18n = require("i18n");
// Extra
var Helper = require("../../helpers/helpers");
const constants = require('../../config/constants');
// Controllers
var {
  AppController
} = require('../cms/AppController');
// Models
var UsersModel = require('../../models/UsersModel');

/**
 * Users
 * It's contains all the opration related with users table. Like userList, userDetails,
 * createUser, updateUser, deleteUser and changeStatus
 */
class UsersController extends AppController {

  constructor() {
    super();

  }

  // Used to get user profile
  async getProfile(req, res) {
    var user_id = req.session.user_id;
    var filter = {
      id: user_id
    };
    var getData = await UsersModel.getSingleData(filter);
    if (getData) {
      return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("USER") + i18n.__("RECORD_FOUND"), getData);
    } else {
      return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("SERVER_ERROR"), []);
    }

  }

  // Used to get user lists
  async list(req, res) {
    try {
      var req_body = req.body;

      let validator = new v(req_body, {
        limit: 'required|integer',
        page: 'required|integer'
      });

      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }

      var limit = (req_body.limit ? req_body.limit : constants.LIMIT_PER_PAGE);
      var pagenumber = req_body.page - 1;
      var filter = (req_body.filter ? req_body.filter : {
        is_active: 1
      });
      var sort_field = (req_body.sort && req_body.sort.field ? req_body.sort.field : "id");
      var sort_order = (req_body.sort && req_body.sort.order ? req_body.sort.order : "desc");

      var getData = await UsersModel
        .query()
        .where(filter)
        .orderBy(sort_field, sort_order)
        .page(parseInt(pagenumber), limit);

      if (getData.total > 0) {
        var pages = Math.ceil((getData.total) / limit);
        var allData = {
          total: getData.total,
          pages: pages,
          list: getData.results
        };
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("USER") + i18n.__("RECORD_FOUND"), allData);
      } else {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("USER") + i18n.__("NOT_FOUND"), []);
      }
    } catch (err) {
      return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }

  
  // Used to fetch Lists
  async get(req, res) {
    try {
      var req_params = req.params;
      // let validator = new v(req_params, {
      //   id: 'required|integer'
      // });
      // let matched = await validator.check();
      // if (!matched) {
      //   for (var key in validator.errors) {
      //     return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
      //   }
      // }

      var filter = {
        id: req_params.id
      };
      var getData = await UsersModel.getSingleData(filter);

      if (getData != undefined) {
        // return getData;
        // return res.send({status:constants.SUCCESS_CODE,data:getData});
        res.sendStatus(200)
        // return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("USER") + i18n.__("RECORD_FOUND"), getData);
      } else {
        return {status:constants.SUCCESS_CODE,data:[]}
        // return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("USER") + i18n.__("NOT_FOUND"), []);
      }
    } catch (err) {
      console.log("err",err);
      return {status:constants.BAD_REQUEST_CODE,data:[]}
      // return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }
 
}


module.exports = new UsersController();