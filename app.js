var express = require('express');
var app = express();

// The front-end stuff originates from here
app.get('/', function(req, res) {
    res.send('Hello world!');
});

// Twilio will ping this when we receieve an SMS
app.get('/sms', function(req, res) {
    console.log(req.params);
});

app.listen(80);