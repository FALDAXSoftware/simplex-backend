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
var UsersModel = require('../../models/cms/UsersModel');

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

  /**
   * Update User details
   * @returns object It's contains status_code, message and userdata
   */
  async updateProfile(req, res) {
    try {
      var req_body = req.body;
      let validator = new v(req_body, {
        first_name: 'required',
        last_name: 'required'
      });

      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }

      var filter = {
        id: parseInt(req.session.user_id)
      };
      var to_be_update = {
        first_name  : req_body.first_name,
        last_name   : req_body.last_name,
        address     : req_body.address,
        postal_code : req_body.postal_code,
        city        : req_body.city,
        state       : req_body.state,
        country     : req_body.country
      };
      let updateData = await UsersModel.updateWithOtherDetails(filter, to_be_update)
      if (updateData) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("RECORD_UPDATED"), []);
      } else {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
      }

    } catch (err) {
      console.log("err",err);
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }

  // Used to fetch Lists
  async get(req, res) {
    try {
      var req_params = req.params;
      let validator = new v(req_params, {
        id: 'required|integer'
      });
      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }

      var filter = {
        id: req_params.id
      };
      var getData = await UsersModel.getSingleData(filter);

      if (getData != undefined) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("USER") + i18n.__("RECORD_FOUND"), getData);
      } else {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("USER") + i18n.__("NOT_FOUND"), []);
      }
    } catch (err) {
      return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }
  // Change Password
  async changePassword(req, res) {
    try {
      var req_body = req.body;
      let validator = new v(req_body, {        
        old_password: 'required',
        password: 'required|minLength:8',
        confirm_password: 'same:password'
      });
    
      let matched = await validator.check();
      
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }
      
      var user_id = req.session.user_id;
      
      var filter = {
        id: user_id
      };
      var getUserData = await UsersModel.getSingleData( filter );
      const passwordValid = await bcrypt.compareSync(req_body.old_password, getUserData.password); // true
      if( !passwordValid ){
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("OLD_WRONG_PASSWORD"), []);
      }
      var password = req_body.password;     
      
      var salt = await bcrypt.genSalt(10);
      var new_encrypt = await bcrypt.hash(password, salt);
      var toBeUpdate = {
        password: new_encrypt
      };
      var change_password = await UsersModel.update(filter, toBeUpdate);
      return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("PASSWORD_CHANGED"), []);
    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }
}


module.exports = new UsersController();