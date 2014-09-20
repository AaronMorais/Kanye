var express = require('express');
var request = require('request');
var config  = require('./config');
var kanye   = require('./kanye');

var twilio = require('twilio')(config.ACCOUNT_SID, config.AUTH_TOKEN);

// Start the express app
var app = express();

var KANYE_PORT = config.DEBUG ? 8000 : 80;
// Services object
var SERVICES = {
  advice: 'http://127.0.0.1:3000',
  hn: 'http://127.0.0.1:3001',
  wolfram: 'http://127.0.01:4000',
  reddit: 'http://127.0.0.1:3002',
  gmail: 'http://127.0.0.1:3003',
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

/*
  Utility endpoint. Allows us to test without sending a text message.
  To use:
    1. Start the server and go to the /test?m={message}
    2. The page should respond with what it would normally text you
*/
app.get('/test', function(req, res) {
  var testParams = {
    From: '+5555555555',
    Body: req.query.m,
    Test: true,
  };

  request({ url: 'http://localhost:' + KANYE_PORT + '/sms', qs: testParams },
    function(error, response, body) {
      if (error) {
        res.status(500).send('Test failed to send. ' + error);
        return;
      }

      res.status(200).send(body);
    });
});

// Twilio will ping this when we receieve an SMS
app.get('/sms', function(req, res) {
  var isLocalTest = req.query.Test;
  var number = req.query.From;
  var message = req.query.Body;
  var state = g_states[number];

  var service;

  if (SERVICES.getServiceFromMessage(message)) {
    service = SERVICES.getServiceFromMessage(message);

    if (config.DEBUG) {
      console.log('Service: %s', service);
    }

    // Update the state and tell the old state we are clearing it
    g_states[number] = service;
    if (state) {
      request(state + "/clear?number=" + number);
    }
    } else if (state) {
      service = state;
    } else {
      service = SERVICES.wolfram;
      console.log('Falling back to Wolfram Alpha service.');
    }

    // Route the request to the proper service.
    // The service should return a JSON object `{ message: ... }` which will contain text
    // to be sent to the user.
    request(service + "/sms?message=" + message + "&number=" + encodeURIComponent(number),
      function(error, response, body) {
        if (error || response.statusCode != 200) {
          // Don't fallback to wolfram alpha, it could've been the one that failed!
          // Send a 'try again later' instead.'
          kanye.sendMessage(number, 'Sorry, I\'m really busy right now. Hit me up later.');
          console.error('Service %s failed.', service);
          return;
        }

        var outgoingMessage = JSON.parse( body ).message;

        // Instead of sending a test message, inline the result directly to webpage.
        if (isLocalTest) {
          res.status(200).send(outgoingMessage);
        } else {
          // Send the outgoing message back to the user
          kanye.sendMessage(number, outgoingMessage);
          res.status(200).end();
        }
      });
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
      body: unescape(message)
    });
  }

  res.status(200).end();
});

app.listen(KANYE_PORT);
console.log('Kanye is at port ' + KANYE_PORT + ' and is ready to help.');
