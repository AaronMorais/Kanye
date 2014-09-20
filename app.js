var express = require('express');
var request = require('request');
var redis   = require('redis');
var config  = require('./config');
var kanye   = require('./kanye');

var twilio = require('twilio')(config.ACCOUNT_SID, config.AUTH_TOKEN);

// Start the express app
var app = express();
var redisClient = redis.createClient();

var KANYE_PORT = config.DEBUG ? 8000 : 80;
// Services object
var SERVICES = {
  advice    : 'http://127.0.0.1:3000',
  hn        : 'http://127.0.0.1:3001',
  wolfram   : 'http://127.0.0.1:4000',
  reddit    : 'http://127.0.0.1:3002',
  inbox     : 'http://127.0.0.1:3003',
  getServiceFromMessage: function(message) {
    // This will return null if no service found.
    return this[message.toLowerCase().split(/\s+/)[0]];
  }
};

var isServiceStateless = function(service) {
  if (service === SERVICES['advice']) {
    return true;
  }
  return false;
};

// Global variable keeps track of the last service that was used by a number.
var g_lastService = {};

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
  var number      = req.query.From;
  var message     = req.query.Body;
  var lastService = g_lastService[number];

  var service;

  if (SERVICES.getServiceFromMessage(message)) {
    service = SERVICES.getServiceFromMessage(message);

    // They have started a new service. Clear the session for the last service they were on.
    if (lastService) {
      request(service + "/clear?number=" + number);
    }

    // Remember the service for next time
    if (isServiceStateless(service)) {
      g_lastService[number] = undefined;
    } else {
      g_lastService[number] = service;
    }
  } else if (lastService) {
    // They didn't match a service, so they may be exploring the last service they were on.
    service = lastService;
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
