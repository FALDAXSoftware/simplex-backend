/**
 * ProductsController
 * 
 */
var i18n = require("i18n");
const v = require('node-input-validator');
// Extra
var Helper = require("../../helpers/helpers");
var constants = require("../../config/constants");
// Controllers
var {AppController} = require('./AppController');
//Models
var ProductsModel = require('../../models/cms/ProductsModel');



class ProductsController extends AppController {

    constructor() {
      super();
    }

    // Used to add new data
     async create(req, res){
        try {
            var req_body = req.body;

            let validator = new v(req_body, {
              name: 'required',
              slug: 'required',
              price: 'required',
              image: 'required'              
            });
      
            let matched = await validator.check();
            if (!matched) {
              for (var key in validator.errors) {
                return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, validator.errors[key].message, []);
              }
            }

            var data = {
                author_id:req.session.user_id,
                name: req_body.name,
                slug: req_body.slug,
                price: req_body.price,
                description: req_body.description,
                image: req_body.image,
            };
            var insertData = await ProductsModel.create( data );       
            if( insertData){
                return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("RECORD_INSERTED"), []);
            }else{
                return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), [] );
            }                     
        }catch(err){
          if( err instanceof ProductsModel.ValidationError ){
            for( var key in err.data ){
              return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, err.data[key][0]["message"], []);  
            }            
          }
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), []);
        }
    }

    // // Used to update notificaiton data
    async update(req, res){
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
                name: req_body.name,
                price: req_body.price,
                description: req_body.description,
                image: req_body.image,
            };
            var updateData = await ProductsModel.update( filter, to_be_update );
            if( updateData){
                return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("RECORD_UPDATED"), []);
            }else{
                return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), [] );
            } 
            
        }catch(err){
            return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("SERVER_ERROR"), [] );
        }
    }

    // Used to fetch Lists
    async list(req, res){
        try{
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
            
            var limit = (req_body.limit ? req_body.limit : constants.LIMIT_PER_PAGE );
            var pagenumber = req_body.page - 1;
            var filter = (req_body.filter ? req_body.filter : {is_active:1} );
            var sort_field = (req_body.sort && req_body.sort.field ? req_body.sort.field : "id" );
            var sort_order = (req_body.sort && req_body.sort.order ? req_body.sort.order : "desc" );
            
            var getData = await ProductsModel
              .query()
              .eager('user')
              .where( filter )        
              .orderBy( sort_field,sort_order )
              .page(parseInt(pagenumber), limit);                
            
            if ( getData.total > 0)  {  
              var pages = Math.ceil( (getData.total)/limit );
              var allData = {
                total:getData.total,
                pages : pages,
                list : getData.results
              };
              return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("PRODUCT") + i18n.__("RECORD_FOUND"), allData);
            } else {
              return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("PRODUCT") + i18n.__("NOT_FOUND"), []);
            }
          }catch( err ){
            return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("SERVER_ERROR"), []);
          }  
    }

    // Used to fetch Lists
    async get(req, res){
        try{
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
            var getData = await ProductsModel.getSingleData( filter );
            
            if ( getData != undefined)  {  
              return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("PRODUCT") + i18n.__("RECORD_FOUND"), getData);
            } else {
              return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("PRODUCT") + i18n.__("NOT_FOUND"), []);
            }
          }catch( err ){
            return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("SERVER_ERROR"), []);
          }  
    }

}

module.exports = new ProductsController();

