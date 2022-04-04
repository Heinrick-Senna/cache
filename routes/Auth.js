const express = require('express')
const app = express.Router()
const authFunc = require('../controllers/Auth')

app.get('/test', authFunc.test)
app.post('/confirm', authFunc.validateTokens)
app.post('/validateLink', authFunc.validateLink)
app.get('/processLink/:storecode/:storekey', authFunc.processLink)
app.get('/callback/:storecode/', authFunc.callback)
app.post('/refreshToken', authFunc.refreshToken)

module.exports = app
