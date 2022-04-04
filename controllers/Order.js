const express = require('express')
const axios = require('axios')
const utf8 = require('utf8');
const crypto = require("crypto");


function FormatDecimal(number){
  return (Math.round(parseFloat(number) * 100) / 100).toFixed(2);
}

function FormatDecimalEn(number){
  return number.replace(',', '.')
}

function convertDate(timestamp){
  var created = Date.parse(timestamp)
  created = new Date(created)
  return created.getFullYear() + '-' + ('0' + (created.getMonth()+1)).slice(-2) + '-' + ('0' + created.getDate()).slice(-2) + ' ' + ('0' + created.getHours()).slice(-2) + ':' + ('0' + created.getMinutes()).slice(-2) + ':' + ('0' + created.getSeconds()).slice(-2)
}

/*
* List Orders
*/

async function getDataOrder(orderId, id_token) {
  async function run_() {

    var config = {
      method: 'GET',
      url: hostApi + '/v1/seller-orders-items/?seller_order' + orderId,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'JWT ' + id_token
      }
    };

    const resp = await axios(config)
    return resp.data

  }
  return run_()
}

exports.lisOrders = async function (req, res) {
  const body = req.body
  const query = req.query

  if( body.tokens.filter(d => d.id == 'param3').length == 0 ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro param3 é obrigatório." }).end();
  const id_token = body.tokens.filter(d => d.id == 'param3')[0].valor;

  let page = 1;
  if( query.page ) page = query.page;

  let page_size = 30;
  let offset = (page - 1) * page_size;

  let endpointParam = ''
  if( query.orderStartDate )
    endpointParam += '&start_date='+query.orderStartDate

  if( query.orderEndDate )
    endpointParam += '&overdue='+query.orderEndDate

  if( query.orderStatus ){
    let status = query.orderStatus
    if (query.orderStatus == 'confirmed')
      status = 'approved'

    endpointParam += '&status='+status
  }

  let endpoint = hostApi + '/v1/seller-orders/?limit='+page_size+'&offset='+offset+endpointParam

  var config = {
    method: 'GET',
    url: endpoint,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'JWT ' + id_token
    }
  };
  
  await axios(config)
  .then( async function (response) {

    let resp = response.data.results
    const orders = [];
    const promises = resp.map(async (value, idx) => {

      const dataOrder = await getDataOrder(value.code, id_token) //Get data order

      const items = []
      Object.entries(value.seller_order_items).forEach(entry => {
        const [k, val] = entry;
        var item = {
          "quantity": parseInt(1),
          "sku": val.seller_product_code,
          "price": FormatDecimal(val.price),
          "total": FormatDecimal(1 * parseFloat(val.price) ),
          "name": val.full_name
        }
        items.push(item)
      })
      
      const order = {
        "id": value.code,
        "order_id": value.code,
        "created": convertDate(value.created_at),
        "receiver_name": value.customer.name,
        "receiver_address_number": value.customer.address.number,
        "receiver_address": value.customer.address.address,
        "receiver_address_complement": value.customer.address.complement,
        "receiver_address_reference": value.customer.address.reference,
        "receiver_city": value.customer.address.city,
        "receiver_state": value.customer.address.state,
        "receiver_zipcode": value.customer.address.zip_code,
        "receiver_neighborhood": value.customer.address.district,
        "payer_name": value.payer.name,
        "payer_address": value.payer.address.address,
        "payer_address_number": value.payer.address.number,
        "payer_address_complement": value.payer.address.complement,
        "payer_additional_info": value.payer.address.reference,
        "payer_neighborhood": value.payer.address.district,
        "payer_city": value.payer.address.city,
        "payer_state": value.payer.address.state,
        "payer_zipcode": value.payer.address.zip_code,
        "payer_cpf": value.payer.document_number,
        "payer_cnpj": null,
        "payer_razao_social": null,
        "payer_email": value.payer.email,
        "payer_gender": null,
        "total_paid": FormatDecimal(value.total_amount),
        "shipping": FormatDecimal(value.total_freight),
        "subtotal": FormatDecimal(value.total_items),
        "discount": null,
        "total": FormatDecimal(value.total_amount),
        "user_client_id": null,
        "status": value.status,
        "external": null,
        "delivery_type": dataOrder.results[0].freight_mode,
        "channel": 'Olist',
        "currency": null,
        "original_id": null,
        "stock_code": null,
        "price_code": null,
        "shipments": null,
        "items": items
      };

      if( value.customer.phones[0].phone )
        order.receiver_phone = value.customer.phones[0].phone

      if( value.payer.phones[0].phone )
        order.payer_phone = value.payer.phones[0].phone

      orders.push( order )

    })
    await Promise.all(promises);

    const jsonReturn = {
      "sucesso": true,
      "orders": orders,
      "total": orders.length,
      "msg": "Pedidos retornados com sucesso"
    };
    return res.json(jsonReturn)

  })
  .catch(function (error) {
    console.log(error.response.data)
    return res.json({ "sucess": false, "mensagem": JSON.stringify(error.response.data) })
  });

};


exports.viewOrders = async function (req, res) {
  const body = req.body
  const query = req.query

  if( body.tokens.filter(d => d.id == 'param3').length == 0 ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro param3 é obrigatório." }).end();
  if( !query.orderId ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro orderId é obrigatório." }).end();

  const id_token = body.tokens.filter(d => d.id == 'param3')[0].valor;

  let endpoint = hostApi + '/v1/seller-orders/' + query.orderId

  var config = {
    method: 'GET',
    url: endpoint,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'JWT ' + id_token
    }
  };
  
  axios(config)
  .then( async function (response) {
    console.log(JSON.stringify(response.data));

    if( query.orderId )
      resp = response.data

    const orders = [];
      
    const dataOrder = await getDataOrder(resp.code, id_token) //Get data order
    const items = []
    Object.entries(resp.seller_order_items).forEach(entry => {
      const [k, val] = entry;
      var item = {
        "quantity": parseInt(1),
        "sku": val.product_sku,
        "price": FormatDecimal(val.price),
        "total": FormatDecimal(1 * parseFloat(val.price) ),
        "name": val.full_name
      }
      items.push(item)
    })
    
    const order = {
      "id": resp.code,
      "order_id": resp.code,
      "created": convertDate(resp.created_at),
      "receiver_name": resp.customer.name,
      "receiver_address_number": resp.customer.address.number,
      "receiver_address": resp.customer.address.address,
      "receiver_address_complement": resp.customer.address.complement,
      "receiver_address_reference": resp.customer.address.reference,
      "receiver_city": resp.customer.address.city,
      "receiver_state": resp.customer.address.state,
      "receiver_zipcode": resp.customer.address.zip_code,
      "receiver_phone": resp.customer.phones[0].phone,
      "receiver_phone2": resp.customer.phones[1].phone,
      "receiver_neighborhood": resp.customer.address.district,
      "payer_name": resp.payer.name,
      "payer_address": resp.payer.address.address,
      "payer_address_number": resp.payer.address.number,
      "payer_address_complement": resp.payer.address.complement,
      "payer_additional_info": resp.payer.address.reference,
      "payer_neighborhood": resp.payer.address.district,
      "payer_city": resp.payer.address.city,
      "payer_state": resp.payer.address.state,
      "payer_zipcode": resp.payer.address.zip_code,
      "payer_phone": resp.payer.phones[0].phone,
      "payer_phone2": resp.payer.phones[1].phone,
      "payer_cpf": resp.payer.document_number,
      "payer_cnpj": null,
      "payer_razao_social": null,
      "payer_email": resp.payer.email,
      "payer_gender": null,
      "total_paid": FormatDecimal(resp.total_amount),
      "shipping": FormatDecimal(resp.total_freight),
      "subtotal": FormatDecimal(resp.total_items),
      "discount": null,
      "total": FormatDecimal(resp.total_amount),
      "user_client_id": null,
      "status": resp.status,
      "external": null,
      "delivery_type": dataOrder.results[0].freight_mode,
      "channel": 'Olist',
      "currency": null,
      "original_id": null,
      "stock_code": null,
      "price_code": null,
      "shipments": null,
      "items": items
    };
    orders.push( order )


    const jsonReturn = {
      "sucesso": true,
      "orders": orders,
      "total": orders.length,
      "msg": "Pedidos retornados com sucesso"
    };
    return res.json(jsonReturn)

  })
  .catch(function (error) {
    console.log(error.response.data)
    return res.json({ "sucess": false, "mensagem": JSON.stringify(error.response.data) })
  });

};


/*
* Update Order (Invoiced)
*/
exports.updateOrderStatus = async function (req, res) {
  const body = req.body
  const query = req.query
  const tokens = JSON.parse( body.APITKN_JSON_TOKENS.replace(/%22/g,'"') ).tokens

  if( tokens.filter(d => d.id == 'param3').length == 0 ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro param3 é obrigatório." }).end();
  if( !query.orderId ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro orderId é obrigatório." }).end();

  const id_token = tokens.filter(d => d.id == 'param3')[0].valor;

  json = {
    "url": body.danfeXml
  }

  var config = {
    method: 'PUT',
    url: hostApi + '/v1/seller-orders/' + query.orderId + '/invoice',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'JWT ' + id_token
    },
    data : json
  };

  // return res.json( config )

  await axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
    return res.json({"sucesso": true, "mensagem": "Alteração de status realizada com sucesso"})
  })
  .catch(function (error) {
    let msg = error.response.data
    if( msg == '' )
      msg = error.response.statusText

    if( msg == 'Not Modified' ){
      return res.json({ "sucess": true, "mensagem": "Pedido com NF já enviado." })
    }else{
      return res.json({ "sucess": false, "mensagem": JSON.stringify(msg) })
    }
    
  });

};
