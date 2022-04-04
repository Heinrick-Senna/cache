const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const fs = require('fs');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser')
const cookieParser = require("cookie-parser");

/* Routes */
const authRoute = require('./routes/Auth')
const productRoute = require('./routes/Product')
const orderRoute = require('./routes/Order')


// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/olist-marketplaces.webstore.net.br/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/olist-marketplaces.webstore.net.br/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/olist-marketplaces.webstore.net.br/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

/* Variables */
global.host = 'https://id-sandbox.olist.com';
global.hostApi = 'https://partners-sandbox.olist.com';
global.client_id = 'webstore';
global.secret_key = 'KaasJYNd-F_Lw391KOz3nS5F7IYCQdm5oLt8gzFX8gU';
global.callback = 'https://olist-marketplaces.webstore.net.br/callback/webstore/';

const app = express()
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname, { dotfiles: 'allow' } ));

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())

app.use(cookieParser());

/* Include routes */
app.use(authRoute)
app.use(productRoute)
app.use(orderRoute)

app.use((error, req, res, next) => {
  return res.status(400).json({'sucesso': false, 'mensagem': error.toString() });
});

// Starting both http & https servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});
