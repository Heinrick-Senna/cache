const axios = require('axios');
const path = require('path');
var cookieParser = require('cookie-parser');
const session = require('express-session');
const qs = require('qs');

exports.test = function(req, res){
  return res.send('Test')
}

/*
* Validate tokens
*/
exports.validateTokens = function(req, res) {
  const body = req.body
  /* Validating */
  if (Object.keys(req.body).length === 0)
    return res.status(400).send({"sucesso" : false, "mensagem" : "Tokens não informados", "validade" : null}).end()

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
    return res.json({ "sucess": true, "mensagem": "Tokens válidos" })
  })
  .catch(function (error) {
    return res.json({ "sucess": false, "mensagem": error.response.data })
  });

}

/*
* Validation link
*/
exports.validateLink = function(req, res) {
	const query = req.query

  if( !query.storecode ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro storecode é obrigatório." }).end();
  if( !query.storekey ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro storekey é obrigatório." }).end();
  
  var url = 'https://olist-marketplaces.webstore.net.br/processLink/'+query.storecode + '/' + query.storekey

  return res.json({ 'link': url })
};


/*
* Validation link
*/
exports.processLink = function (req, res) {
  const param = req.params

  if( !param.storecode ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro storecode é obrigatório." }).end();
  if( !param.storekey ) return res.status(400).send({"sucesso" : false, "mensagem" : "Parametro storekey é obrigatório." }).end();

  var url = host + '/openid/authorize?client_id='+client_id+'&redirect_uri='+callback+'&response_type=code&scope=openid%20email%20profile&state='+secret_key

  res.cookie('ws_olist_tokens', JSON.stringify({'storecode': param.storecode, 'storekey': param.storekey}) )
  console.log( url )
  return res.status(200).redirect( url )
};



/*
* Callback with creditials code
*/
exports.callback = function(req, res){
  const query = req.query
  const tokensWs = JSON.parse( req.cookies.ws_olist_tokens )

  var data = qs.stringify({
    "code": query.code,
    "client_id": client_id,
    "client_secret": secret_key,
    "redirect_uri": callback,
    "grant_type": 'authorization_code'
  });

  var config = {
    method: 'post',
    url: host + '/openid/token/',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded', 
    },
    data : data
  };
  
  axios(config)
  .then(function (response) {
    let result = response.data

    /*
    * Send access token to webstore
    */
    const json = {
      "param1": result.access_token,
      "param2": result.refresh_token,
      "param3": result.id_token,
      "validade": result.expires_in
    }
    // return res.json( json )
    console.log( tokensWs )
    return res.render(path.join(process.cwd(), '/view', 'form.html'), {json: JSON.stringify(json), storecode: tokensWs.storecode, storekey: tokensWs.storekey});
  })
  .catch(function (error) {
    console.log(error.data);
    return res.json(error.data)
  });

}


/*
* Refresh Token
*/
exports.refreshToken = function (req, res) {
  const body = req.body
  const timestamp = Math.round((new Date()).getTime() / 1000);

  /* Validating */
  if (Object.keys(req.body).length === 0)
    return res.status(400).send({"sucesso" : false, "mensagem" : "Tokens não informados", "validade" : null}).end()


  if( body.tokens.filter(d => d.id == 'param2').length == 0 ) return res.status(400).send({"sucesso" : false, "mensagem" : "param2 é obrigatório." }).end();

  const refresh_token = body.tokens.filter(d => d.id == 'param2')[0].valor;

  var data = qs.stringify({
    'refresh_token': refresh_token,
    'client_id': client_id,
    'client_secret': secret_key,
    'grant_type': 'refresh_token' 
  });
  var config = {
    method: 'post',
    url: host + '/openid/token',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data : data
  };
  
  axios(config)
  .then(function (response) {

    const json = {
      "param1": response.data.access_token,
      "param2": response.data.refresh_token,
      "param3": response.data.id_token,
      "validade": response.data.expires_in
    }

    return res.json(json)

  })
  .catch(function (error) {
    console.log(error.response.data);
    return res.json(error.response.data)
  });

 
};