/**
 * UserdetailsController
 * 
 */
const v = require('node-input-validator');
var i18n = require("i18n");
// Extra
const constants = require('../../config/constants');
var Helper = require("../../helpers/helpers");
// Controllers
var {AppController} = require('./AppController');
// Models
var UserdetailsModel = require('../../models/cms/UserdetailsModel');

/**
 * Users Details
 * It's contains all the opration related with users table. Like userList, userDetails,
 * createUser, updateUser, deleteUser and changeStatus
 */
class UserdetailsController extends AppController {

  constructor() {
    super();
  }

  

  /**
   * Update User details
   * @returns object It's contains status_code, message and userdata
   */
  async update(req, res) {
    try {
      var req_body = req.body;
      let validator = new v( req_body, {
        user_id: 'required',
        address: 'required',
        postal_code: 'required',
        city: 'required',
        state: 'required',
        country: 'required'
      });

      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }
      
      var filter = {
        user_id: parseInt(req_body.user_id)
      };
      var to_be_update = {
        address: req_body.address,
        postal_code: req_body.postal_code,
        city: req_body.city,
        state: req_body.state,
        country: req_body.country
      };
      let updateData = await UserdetailsModel.update( filter, to_be_update )
      if( updateData ){
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("RECORD_SAVED"), []);  
      }else{
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
      }
            
    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }
}


module.exports = new UserdetailsController();