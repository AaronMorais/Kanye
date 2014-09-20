var express = require('express');
var request = require('request');
var config = require('./config');

var twilio = require('twilio')(config.ACCOUNT_SID, config.AUTH_TOKEN);

// Start the express app
var app = express();

// Services object
var SERVICES = {
    advice: "http://127.0.0.1:3000",
    hn: "http://127.0.0.1:3001",
    wolfram: "http://127.0.01:4000",
    reddit: "http://127.0.0.1:3002",
    getServiceFromMessage: function(message) {
        return this[message.toLowerCase().split(/\s+/)[0]];
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

    if (SERVICES.getServiceFromMessage(message)) {
        service = SERVICES.getServiceFromMessage(message);

        // Update the state and tell the old state we are clearing it
        g_states[number] = service;
        if (state) {
            request(state + "/clear?number=" + number);
        }
    } else if (state) {
        service = state;
    } else {
        service = SERVICES.wolfram;
        console.log("WOLFRAM SERVICE BY DEFAULT");
    }

    // Now we know which service we should notify
    // lets build a request and notify it
    request(service + "/sms?message=" + message + "&number=" +
        encodeURIComponent(number), function(error, response, body) {
            if (error || response.statusCode != 200) {
                // This service didn't handle us properly
                // Let's just fallback to wolfram
                // TODO do when wolfram service is implemented
                service = SERVICES.wolfram;
                g_states[number] = service;
                if (state) {
                    request(state + "/clear?number=" + number);
                }
                console.log("WOLFRAM SERVICE FROM ERR");

                request(service + "/sms?message=" + message + "&number=" +
                    encodeURIComponent(number));
            }
    });

    // OK everything went well, send 200 and end request
    res.status(200).end();
});

app.get('/sendsms', function(req, res) {
    var message = req.query.message;
    var number = req.query.number;
    var media = req.query.media;

    if (media) {
        console.log("SENT MMS");
        twilio.sendMessage({
            to: number,
            from: config.PHONE_NUMBER,
            mediaUrls: [media]
        });
    } else {
        twilio.sendMessage({
            to: number,
            from: config.PHONE_NUMBER,
            body: message
        });
    }

    res.status(200).end();
});

app.listen(80);
