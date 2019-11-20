/**
 * AuthController
 * 
 */
var jwt = require('jwt-simple');
var moment = require('moment')
const uuidv4 = require('uuid/v4');
var aesjs = require('aes-js');
var bcrypt = require('bcryptjs');
const v = require('node-input-validator');
var i18n = require("i18n");
var parseHTML = require("node-html-parser");
// Extra
const constants = require('../../config/constants');
var Helper = require("../../helpers/helpers");
// Controllers
var {AppController} = require('./AppController');
// Models
var UsersModel = require('../../models/cms/UsersModel');
var EmailtemplateModel = require('../../models/cms/EmailtemplateModel');


class AuthContoller extends AppController {

  constructor() {
    super();
  }

  /**
   * SignUp
   * 
   * @param {*} req 
   * @param {*} res 	
   *
   * @returns object It's contains status_code, message and data
   */
  async signup(req, res) {
    try {
      var req_body = req.body;

      let validator = new v(req_body, {
        email: 'required|email',
        password: 'required|minLength:8',
        first_name: 'required',
        last_name: 'required',
        contact_number: 'required|integer|digitsBetween:10,15',
        role_id: 'required|integer'
      });
      
      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }

      var salt = await bcrypt.genSalt(10);
      var encryptpass = await bcrypt.hash(req_body.password, salt);
      // Check Email or Contact Number existance
      var filter = function () {
        this.where('email', req_body.email).orWhere('contact_number', req_body.contact_number)
      };
      var getUserExist = await UsersModel.getUserdata(filter);

      if (getUserExist != undefined) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("ACCOUNT_ALREADY_EXIST"), []);
      }

      var new_data = {
        email: req_body.email,
        password: encryptpass,
        first_name: req_body.first_name,
        last_name: req_body.last_name,
        contact_number: req_body.contact_number,
        role_id: req_body.role_id,
        activation_token: Helper.randomString(20)
      };


      var userResult = await UsersModel
        .query()
        .insert(new_data);

      if (userResult instanceof UsersModel) {
        let filter = {
          id: userResult["id"]
        };
        let get_user = await UsersModel.getUserdata(filter);
        var emailData = await EmailtemplateModel
          .query()
          .first()
          .where('slug', "activation_mail");

        let emailContent = emailData
          .content
          .replace("%username%", (get_user.first_name + " " + get_user.last_name));

        emailContent = emailContent.replace('%product_name%', process.env.PROJECT_NAME);
        emailContent = emailContent.replace('%activationLink%', process.env.SITE_URL + "admin/auth/verify_activation/" + get_user.activation_token);
        emailContent = emailContent.replace('%product_name%', process.env.PROJECT_NAME);

        // Email
        var allData = {
          template: "emails/common.pug",
          email: get_user.email,
          extraData: {
            html_template_content: parseHTML.parse(emailContent)
          },
          subject: i18n.__("SUBJECT_ACTIVATE_ACCOUNT")
        }
        await Helper.SendEmail(res, allData);
        // Ends

        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("ACTIVATE_ACCOUNT"), get_user);
      } else {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
      }
    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }

  /**
   *  Activate Account
   *  It will check verification token and activate the user's account.
   *
   *  @param void
   *
   *  @return object
   */
  async activateAccount(req, res) {
    try {
      var activation_token = req.params.token;

      let filter = {
        activation_token: activation_token
      };
      let getTokenData = await UsersModel.getUserdata(filter);
      if (getTokenData == undefined) {
        res.render("emails/messages.pug", {
          "type": "error",
          "message": i18n.__("LINK_EXPIRED")
        });
      } else {
        await getTokenData
          .$query()
          .patch({
            "is_active": true,
            "activation_token": ""
          });
        res.render("emails/messages.pug", {
          "type": "success",
          "message": i18n.__("ACCOUNT_ACTIVATED_SUCCESS")
        });
      }
    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }



  /**
   *  Login
   *  Check for valid user's email and password and
   *
   *  @param object Request Data It's contains email and password for check user
   *
   *  @return object
   */
  async login(req, res) {
    try {

      var req_body = req.body;

      let validator = new v(req_body, {
        email: 'required|email',
        password: 'required',
        ip: 'required'
      });

      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }

      var filterData = {
        email: (req_body.email).toLowerCase(),
        role_id: 1
      };
      var getUserData = await UsersModel.getUserdata(filterData);

      if (getUserData == undefined) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("ACCOUNT")+i18n.__("NOT_EXIST"), []);
      }

      var check_validity = await module.exports.validateUserCredentials(req_body, getUserData); // Check Credentials Validity      
      if (!check_validity.status) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, check_validity.message, []);
      }
      
      return Helper.jsonFormat(res, constants.SUCCESS_CODE, check_validity.message, module.exports.genToken(check_validity.data));
    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }


  /**
   *  Forgot Password
   *  Send email with reset password link to entered email address
   *
   *  @param object Request Data It's contains email for reset password
   *
   *  @return object
   */
  async forgotPassword(req, res) {

    try {

      var req_body = req.body;

      let validator = new v(req_body, {
        email: 'required|email'
      });
      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }

      var filterData = {
        email: (req_body.email).toLowerCase(),
        role_id: 1
      };
      var userDetails = await UsersModel.getUserdata(filterData);

      if (userDetails == undefined) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("EMAIL") + i18n.__("NOT_FOUND"), []);
      }

      if (!userDetails.is_active) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("ACCOUNT") + i18n.__("NOT_ACTIVATE"), []);
      }


      var forgot_token = uuidv4();

      await userDetails
        .$query()
        .patch({
          "forgot_token": forgot_token
        });

      if (forgot_token == userDetails.forgot_token) {
        let filter = {
          slug:"forgot_password"
        };
        var emailData = await EmailtemplateModel.getSingleData( filter );
        if( emailData == undefined ){
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("UNABLE_TO_SEND_EMAIL"), []);
        }  
        let emailContent = emailData
          .content
          .replace("%username%", userDetails.email);
        emailContent = emailContent.replace('%product_name%', process.env.PROJECT_NAME);
        emailContent = emailContent.replace('%reset_link%', process.env.SITE_URL + "admin/auth/reset-password/" + userDetails.forgot_token);
        emailContent = emailContent.replace('%product_name%', process.env.PROJECT_NAME);

        // Email
        var allData = {
          template: "emails/common.pug",
          email: userDetails.email,
          extraData: {
            html_template_content: parseHTML.parse(emailContent)
          },
          subject: i18n.__("FORGOT_PASSWORD_SUBJECT")
        }

        await Helper.SendEmail(res, allData);
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("FORGOT_PASSWORD"), []);
      } else {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
      }
    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }

  /**
   *  Reset Password
   *  It will check forgot passwrod token and reset the password of that user.
   *
   *  @param object Request Data It's contains new_password and confirm_password
   *
   *  @return object
   */
  async resetPassword(req, res) {

    try {
      let forgot_token = req.params.token;

      let filter = {
        forgot_token: forgot_token,
        is_active: 1,
        role_id: 1
      };
      let getTokenData = await UsersModel.getUserdata(filter);

      if (getTokenData == undefined) {
        res.render("emails/messages.pug", {
          "type": "error",
          "message": i18n.__("FORGOT_PASSWORD_TOKEN_MISMATCH")
        });
      }

      res.render("pages/form_reset_password.pug", {
        "token": forgot_token
      });
    } catch (err) {
      if (err instanceof UsersModel.NotFoundError) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, constants.invalid_password_link, []);
      }
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, constants.SERVER_ERROR, []);
    }
  }

  /**
   *	Validate
   *	Used for validate user with username and password
   *
   *	@param string username current user's email address
   *	@param string password current user's password
   *
   *	@return boolean/object
   */
  async validateUserCredentials(req_body, userData) {
    try {
      const passwordValid = await bcrypt.compareSync(req_body.password, userData.password); // true
      
      if (!passwordValid) {
        return {
          status: false,
          message: i18n.__("INVALID_CREDENTIALS")
        };
      }
      if (!userData.is_active) {
        return {
          status: false,
          message: i18n.__("ACCOUNT_NOT_ACTIVATED")
        };
      }

      
      var client_key = uuidv4();
      var updateData = {
        "client_key": client_key,
        "ip": req_body.ip
      };
      await userData
        .$query()
        .patch(updateData);

      return {
        status: true,
        message: i18n.__("USER") + i18n.__("RECORD_FOUND"),
        data: userData
      };


    } catch (e) {
      return {
        status: false,
        message: i18n.__("SERVER_ERROR")
      };
    }
  }

  /**
   *	Get Token
   *	Used for get current user's token when user login.
   *
   *	@param object user user's recored from database
   *
   *	@return object
   */
  genToken(user) {

    var expires = module
      .exports
      .expiresIn(7); // 7 days
    var token = jwt.encode({
      exp: expires,
      id: user.id,
      client_key: user.client_key,
      role_id: user.role_id
    }, require('../../config/secret')());

    return {
      token: token,
      expires: expires,
      user: user
    };
  }

  expiresIn(numDays) {

    var dateObj = new Date();
    return dateObj.setDate(dateObj.getDate() + numDays);
  }

  /**
   *  Logout
   *  Logout user and update device token
   *  @return object
   */
  async logout(req, res) {
    try {
      var user_id = req.session.user_id;
      if (user_id == "") {
        return Helper.jsonFormat(res, constants.UNAUTHORIZED_CODE, i18n.__("SERVER_ERROR"), []);
      }
      var filter = {
        id: user_id
      };
      var tobeUpdate = {
        device_type: "",
        device_token: "",
        client_key: ""
      };
      var updateUser = await UsersModel.update(filter, tobeUpdate);
      return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("LOGOUT_SUCCESS"), []);

    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }



  /**
   *  Channge Password
   *  @return object
   */
  async changePassword(req, res) {
    try {
      var password = req.body.password;
      var forgot_token = req.body.token;
      var filter = {
        forgot_token: forgot_token
      };

      var salt = await bcrypt.genSalt(10);
      var new_encrypt = await bcrypt.hash(password, salt);
      var toBeUpdate = {
        password: new_encrypt,
        forgot_token: ""
      };
      var change_password = await UsersModel.update(filter, toBeUpdate);
      return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("PASSWORD_CHANGED"), []);
    } catch (err) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }

  // Temporary File Upload
  async tempFileUpload(req, res) {
    try {
      var req_file = req.files.file;
      let validator = new v(req_file, {
        name: 'required',
        data: 'size:1mb,100kb',
        mimetype: 'extention'
      });

      let matched = await validator.check();
      if (!matched) {
        for (var key in validator.errors) {
          return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
        }
      }

      let file_upload = await Helper.FileUpload(req_file, "images/temp/");
      return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("FILE_UPLOADED"), file_upload);
    } catch (e) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
    }
  }
}
module.exports = new AuthContoller();