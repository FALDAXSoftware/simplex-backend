/**
 * SettingsController
 * 
 */
const {raw} = require('objection');
var i18n = require("i18n");
// Extra
const constants = require('../../config/constants');
var Helper = require("../../helpers/helpers");
//Controllers
var {AppController} = require('./AppController');
//Models
var SettingsModel = require('../../models/cms/SettingsModel');

/**
 * Settings
 */
class SettingsController extends AppController {

  constructor() {

    super();
  }
  
  
}

module.exports = new SettingsController();

