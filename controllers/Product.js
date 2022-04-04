const express = require('express')
const axios = require('axios')
var fs = require('fs');


function FormatDecimal(number){
  if( !number )
    number = 0
  return (Math.round(number * 100) / 100).toFixed(2);
}

/*
* List Products
*/
exports.listProducts = async function (req, res) {
  const body = req.body
  const query = req.query

  if( body.tokens.filter(d => d.id == 'param3').length == 0 ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro param3 é obrigatório." }).end();

  const id_token = body.tokens.filter(d => d.id == 'param3')[0].valor;

  let page = 1;
  if( query.page ) page = query.page;

  let page_size = 30;
  let offset = (page - 1) * page_size;

  var config = {
    method: 'get',
    url: hostApi + '/v1/seller-products/?limit='+page_size+'&offset='+offset,
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'JWT ' + id_token
    }
  };
  
  axios(config)
  .then(function (response) {

    let itens = []
    Object.entries(response.data.results).forEach(entry => {
      const [key, value] = entry;

      var item = new Object();
      item.sku = value.product_code
      item.addInfoJson = null
      item.ean = null
      item.ncm = null
      item.name = value.name
      item.external = value.sku
      item.quantity = value.stock[0].quantity
      item.special_price = parseFloat(FormatDecimal(value.price))
      item.price = parseFloat(FormatDecimal(value.price))
      item.short_description = null
      item.description = value.description
      item.video = null
      item.brand = value.brand
      item.cost = 0
      item.warranty_time = 0
      item.warranty_message = null
      item.link = null

      available = 0
      if( value.active ) available = 1
      item.available = available
      
      item.handling_time = 0
      item.manufacture_time = 0
      item.categories = value.categories
      item.dimension = {
        'length': parseFloat(FormatDecimal(value.product_measures[0].length_value)),
        'width': parseFloat(FormatDecimal(value.product_measures[0].width_value)),
        'height': parseFloat(FormatDecimal(value.product_measures[0].height_value)),
        'weight': parseFloat(FormatDecimal(value.product_measures[0].weight_value))
      };
      item.attributes = null

      const photos = [];
      Object.entries(value.photos).forEach(entry => {
        const [key, value] = entry;
        photos.push( { 'url': value.url }  )
      });
      item.photos = photos;
      item.variations = null

      itens.push( item )
    })

    const jsonReturn = {
      "sucess": true,
      "msg": "",
      "total": response.data.count,
      "totalPages": Math.ceil(response.data.count / page_size),
      "size": page_size,
      "products": itens
    };

    return res.json(jsonReturn)

  })
  .catch(function (error) {
    console.log( error.response.data );
    return res.json({ "sucess": false, "mensagem": JSON.stringify( error.response.data ) })
  });

};

/*
* View Product
*/
exports.viewProduct = async function (req, res) {
  const body = req.body
  const query = req.query

  if( !query.sku ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro sku é obrigatório." }).end();
  if( body.tokens.filter(d => d.id == 'param3').length == 0 ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro param3 é obrigatório." }).end();

  const id_token = body.tokens.filter(d => d.id == 'param3')[0].valor;

  var config = {
    method: 'get',
    url: hostApi + '/v1/seller-products/?product_code='+query.sku,
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'JWT ' + id_token
    }
  };
  
  axios(config)
  .then(function (response) {
    let itens = []

    if( response.data.count == 0 )
      return res.json({ "sucess": false, "mensagem": "Produto não encontrado" })

    let data = response.data.results[0]

    let quantity = 0
    if( data.stock )
      quantity = data.stock[0].quantity
  
    var item = new Object();
    item.sku = data.product_code
    item.addInfoJson = null
    item.ean = null
    item.ncm = null
    item.name = data.name
    item.external = data.sku
    item.quantity = quantity
    item.special_price = parseFloat(FormatDecimal(data.price))
    item.price = parseFloat(FormatDecimal(data.price))
    item.short_description = null
    item.description = data.description
    item.video = null
    item.brand = data.brand
    item.cost = 0
    item.warranty_time = 0
    item.warranty_message = null
    item.link = null

    available = 0
    if( data.active ) available = 1
    item.available = available

    
    item.handling_time = 0
    item.manufacture_time = 0
    item.categories = data.categories
    item.dimension = {
      'length': parseFloat(FormatDecimal(data.product_measures[0].length_value)),
      'width': parseFloat(FormatDecimal(data.product_measures[0].width_value)),
      'height': parseFloat(FormatDecimal(data.product_measures[0].height_value)),
      'weight': parseFloat(FormatDecimal(data.product_measures[0].weight_value))
    };
    item.attributes = null


    const photos = [];
    Object.entries(data.photos).forEach(entry => {
      const [key, val] = entry;
      photos.push( { 'url': val.url }  )
    });
    item.photos = photos;
    item.variations = null

    itens.push( item )

    const jsonReturn = {
      "sucess": true,
      "msg": "",
      "products": itens
    };

    return res.json(jsonReturn)

  })
  .catch(function (error) {
    console.log( error.response.data );
    return res.json({ "sucess": false, "mensagem": JSON.stringify(error.response.data) })
  });
}

/*
* Get total Products
*/
exports.totalProduct = function (req, res) {
  const body = req.body

  if( body.tokens.filter(d => d.id == 'param3').length == 0 ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro param3 é obrigatório." }).end();

  const id_token = body.tokens.filter(d => d.id == 'param3')[0].valor;

  var config = {
    method: 'get',
    url: hostApi + '/v1/seller-products/',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'JWT '+id_token
    }
  };
  
  axios(config)
  .then(function (response) {
    return res.json({ "sucess": true, "total": response.data.count })
  })
  .catch(function (error) {
    return res.json({ "sucess": false, "mensagem": JSON.stringify(error.response.data) })
  });
}

async function checkSKU(sku, id_token){

  var config = {
    method: 'get',
    url: hostApi + '/v1/seller-products/?product_code=' + sku,
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'JWT ' + id_token
    }
  };

  let result = {}
  await axios(config)
  .then(function (response) {

    if( response.data.count > 0 ){
      result = {'sucess': true, 'method': 'update', 'product': response.data.results }
    }else{
      result = {'sucess': true, 'method': 'insert'}
    }
    
  })
  .catch(function (error) {
    result = {'sucess': false, 'msg': JSON.stringify(error.response.data)}
    console.log( JSON.stringify(error.response.data) )
  });

  return result

}

async function saveProduct_(product, parent, type, id_token) {

  const photos = []
  Object.entries( product.photos ).forEach(entry => {
    const [key, value] = entry;
    const item = {}
    item.order = key
    item.url = value.url
    photos.push( item )
  })

  let parentProduct = product
  if( type == 'variation' )
    parentProduct = parent


  // (1) Change if it's update or insert product
  let _checkSKU = await checkSKU(parentProduct.sku, id_token)

  if( _checkSKU.sucess == false ){
    return _checkSKU
  }

  let method = _checkSKU.method


  let packages = {}

  if( product.dimension ){
    packages = {
      "height_unit": "cm",
      "height_value": FormatDecimal(product.dimension.height),
      "length_unit": "cm",
      "length_value": FormatDecimal(product.dimension.length),
      "weight_unit": "kg",
      "weight_value": FormatDecimal(product.dimension.weight),
      "width_unit": "cm",
      "width_value": FormatDecimal(product.dimension.width),
    }
  }else{
    if( parentProduct.dimension ){
      packages = {
        "height_unit": "cm",
        "height_value": FormatDecimal(parentProduct.dimension.height),
        "length_unit": "cm",
        "length_value": FormatDecimal(parentProduct.dimension.length),
        "weight_unit": "kg",
        "weight_value": FormatDecimal(parentProduct.dimension.weight),
        "width_unit": "cm",
        "width_value": FormatDecimal(parentProduct.dimension.width),
      }
    }
  }

  let offer = product.price
  if( product.special_price )
    if( product.special_price > 0 )
      offer = product.special_price

  var data = {
    "attributes": [],
    "availability_days": 0,
    "brand": parentProduct.brand,
    "categories": [],
    "description": parentProduct.description,
    "free_shipping": false,
    "gtin": product.ean,
    "name": product.name,
    "origin": "Webstore",
    "package_measures": [ packages ],
    "photos": photos,
    "price": product.price,
    "prices": [
      {
        "channel_slug": "ecommerce",
        "currency": "BRL",
        "minimum_quantity": 1,
        "offer": offer,
        "value": product.price,
        "price_freight_shift": "0.00"
      },
      {
        "channel_slug": "mercadolivre",
        "currency": "BRL",
        "minimum_quantity": 1,
        "offer": offer,
        "value": product.price,
        "price_freight_shift": "0.00",
        "free_shipping_amount": "0.00",
        "store_prices": [],
        "commission_freight": null,
        "commission_product": null,
        "enable_subsidy": false
      },
      {
          "channel_slug": "digitalweb",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "compra1000",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "carrefour",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "magazineluiza",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "b2w",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "zoom",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "leroymerlin",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "cnova",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "luanet",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "amazon",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "colombo",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "madeiramadeira",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "saraiva",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "clickspace",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
      {
          "channel_slug": "consultaremedios",
          "currency": "BRL",
          "minimum_quantity": 1,
          "offer": offer,
          "value": product.price,
          "price_freight_shift": "0.00",
          "free_shipping_amount": "0.00",
          "store_prices": [],
          "commission_freight": null,
          "commission_product": null,
          "enable_subsidy": false
      },
    ],
    "in_campaign": false,
    "product_code": product.sku,
    "product_measures": [ packages ],
    "seller_id": "7e2387ea-3707-4da1-b97b-632c610e2bf4",
    "stock": [
      {
        "availability_days": 0,
        "quantity": product.quantity
      }
    ],
    "tags": []
  };

  
  var config = {
    method: 'post',
    url: hostApi + '/v1/seller-products/',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'JWT ' + id_token
    },
    data : data
  };

  if( method == 'update' ){
    config.method = 'PATCH'
    config.url = hostApi + '/v1/seller-products/'+_checkSKU.product[0].sku+'/'
  }

  let result = {}
  await axios(config)
  .then(function (response) {
    result = response.data
    // console.log(JSON.stringify(response.data));
    result = {'sucess': true, 'msg': JSON.stringify(response.data)}
  })
  .catch(function (error) {
    result = {'sucess': false, 'msg': JSON.stringify(error.response.data)}
    console.log( JSON.stringify(error.response.data) )
  });

  return result

}

/*
* Insert Product
*/
exports.saveProduct = async function(req, res) {
  const body = req.body
  const query = req.query

  if( body.ApiDados.ConfigLoja.tokens.filter(d => d.id == 'param3').length == 0 ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro param3 é obrigatório." }).end();

  const id_token = body.ApiDados.ConfigLoja.tokens.filter(d => d.id == 'param3')[0].valor;
  const product = body.produto


  // (1) Save product
  let log = await saveProduct_( product, null, 'product', id_token)
  if( log.sucess == false )
    return res.json({"sucess": false, "status_code": "400", "msg": JSON.stringify(log.msg) })
  

  //(2) Save variations
  let variations = product.variations
  if( variations ){
    const promises = variations.map(async (val, idx) => {
      let logV = await saveProduct_( val, product, 'variation', id_token)
      if( logV.sucess == false )
        return res.json({"sucess": false, "status_code": "400", "msg": JSON.stringify(logV.msg) })
    })
    await Promise.all(promises);
  }

  return res.json({
    "sucess": true,
    "status_code": "200",
    "msg": 'Produto salvo com sucesso',
    "external_code": ""
  })
  
};
