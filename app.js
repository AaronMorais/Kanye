var express = require('express');
var app = express();

// Services object
var SERVICES = {
    advice: "http://104.131.9.39:3000",
    hn: "http://104.131.9.39:3001",
    getServiceFromMessage: function(message) {
        return this[message.split(/\s+/)[0]];
    }
};

// Global var maintaining current command state per phone number
var g_states = {};

// The front-end stuff originates from here
app.get('/', function(req, res) {
    res.send('Hello world!');
});

// Twilio will ping this when we receieve an SMS
app.get('/sms', function(req, res) {
    var number = req.query.From;
    var message = req.query.Body;
    var state = g_states[number];

    var service;
    if (state) {
        service = SERVICES[state];
    } else {
        service = SERVICES.getServiceFromMessage(message);
    }

    console.log(req.query);
    console.log(service);
});

app.listen(80);
