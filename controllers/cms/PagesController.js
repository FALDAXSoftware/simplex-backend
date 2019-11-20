var {
  AppController
} = require('./AppController');
var PagesModel = require('../../models/cms/PagesModel');
var Helper = require("../../helpers/helpers");
const constants = require('../../config/constants');
var i18n = require("i18n");
const v = require('node-input-validator');

/**
 * Email Templates
 * It's contains all the opration related with email templates table. Like emailTemplateList,
 * emailTemplatesDetails, updateEmailTemplates
 */
class EmailtemplateController extends AppController {

  constructor() {
    super();
  }

  /**
   * Get Email Templates List
   * Used for get all the email templates list with pagination
   *
   * @param {*} req It's contains all the parameters like q for search etc...
   * @param {*} res
   *
   * @returns object It's contains status_code, message and email template data
   */
  async list(req, res) {

    try {
      var filter = {
        is_active: true
      };
      var allEmailTemplates = await PagesModel.getMultipleData(filter);
      if (allEmailTemplates.length > 0) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("RECORD_FOUND"), allEmailTemplates);
      } else {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("RECORD_FOUND"), []);
      }

    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }

  /**
   * Get Email Template Details
   * Used for get single email template details
   *
   * @param {*} req It's contains encripted static content id
   * @param {*} res
   *
   * @returns object It's contains status_code, message and email template data
   */
  async get(req, res) {

    try {
      var req_params = req.params;
      let validator = new v(req_params, {
        id: 'required'
      });

      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }

      var filter = {
        id: parseInt(req_params.id)
      };
      var allEmailTemplates = await PagesModel.getSingleData(filter);
      if (allEmailTemplates != undefined) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("RECORD_FOUND"), allEmailTemplates);
      } else {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("RECORD_FOUND"), []);
      }
    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }

  // // Used to update tempalte
  async update(req, res) {
    try {
      var req_body = req.body;

      let validator = new v(req_body, {
        id: 'required'
      });

      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }

      var filter = {
        id: req_body.id,
      };
      var to_be_update = {
        title: req_body.title,
        price: req_body.price,
        content: req_body.content
      };
      var updateData = await PagesModel.update(filter, to_be_update);
      if (updateData) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("RECORD_UPDATED"), []);
      } else {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
      }

    } catch (err) {

      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }

  // Used to add new data
  async create(req, res) {
    try {
      var req_body = req.body;

      let validator = new v(req_body, {
        title: 'required',
        slug: 'required',
        content: 'required'
      });

      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }

      var data = {
        title: req_body.title,
        slug: req_body.slug,
        content: req_body.content
      };
      var insertData = await PagesModel.create(data);
      if (insertData) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("RECORD_INSERTED"), []);
      } else {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
      }
    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR_CODE"), []);
    }
  }
}

module.exports = new EmailtemplateController();