var express       = require('express');
var request       = require('request');
var redis         = require('redis');
var cookieSession = require('cookie-session');
var config        = require('./config');
var kanye         = require('./kanye');
var twilio        = require('twilio')(config.ACCOUNT_SID, config.AUTH_TOKEN);

// Start the express app
var app = express();
app.use(express.static(__dirname + '/static'));
app.use(cookieSession({ keys: [config.SECRET_KEY]}));

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

// XXX eventually register services and ask this, or figure it out
// somehow non-hacky
var isServiceStateless = function(service) {
  if (service === SERVICES['advice']) {
    return true;
  }
  return false;
};

// Global variable keeps track of the last service that was used by a number.
var g_lastService = {};
// Global variable tracks if a number is waiting for a response.
var g_isWaiting = {};

// The front-end stuff originates from here
app.get('/', function(req, res) {
  res.sendfile(__dirname + "/static/index.html");
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

  if (config.DEBUG) {
    console.log('Sending test params...');
    console.log( testParams);
  }

  request({ url: 'http://localhost:' + KANYE_PORT + '/sms', qs: testParams },
    function(error, response, body) {
      if (error) {
        res.status(500).send('Test failed to send. ' + error);
        return;
      }

      res.status(200).send(body);
    });
});

/*
  // **** START GMAIL AUTHORIZATION CODE ****
  This endpoint handles authentication with GMail.
*/

app.get('/gmail', function(req, res) {
  var userNumber = req.query.number;

  request({ url: SERVICES.inbox + '/auth_url', qs: { number: userNumber } },
    function(error, response, body) {
      // Set the cookie for later use.
      req.session.number = userNumber;
      // Body contains the URL to get to.
      res.cookie({ number: userNumber }).redirect(body);
    });
});

// Called right after they authenticate in /gmail
app.get('/oauth2callback', function(req, res) {
  var authorizationCode = req.query.code;
  var number = req.session.number;

  request({ url: SERVICES.inbox + '/get_tokens', qs: { code: authorizationCode, number: number }},
    function(error, response, body) {
      if (error) {
        res.status(500).send('Failed to get authentication token.');
        return;
      }

      res.status(200).send('Token authentication successful. You can now use the inbox command');
    });
});

// **** END GMAIL AUTHORIZATION CODE ****

var sendBodyResult = function(number, body, res) {
  var bodyJSON = body ? JSON.parse( body ) : {};
  var outgoingMessage = bodyJSON.message;
  var outgoingMedia   = bodyJSON.media;
  var outgoingError   = bodyJSON.error;

  if (outgoingError) {
    if (isLocalTest) {
      res.status(200).send(outgoingError);
    } else {
      kanye.sendMessage(number, outgoingError);
    }
    return;
  }

  // Instead of sending a test message, inline the result directly to webpage.
  if (isLocalTest) {
    res.status(200).send(outgoingMessage);
  } else {
    // Send the outgoing message back to the user
    kanye.sendMessage(number, outgoingMessage, outgoingMedia);
    res.status(200).end();
  }
}

// Twilio will ping this when we receieve an SMS
app.get('/sms', function(req, res) {
  var isLocalTest = req.query.Test;
  var number      = req.query.From;
  var message     = req.query.Body;
  var lastService = g_lastService[number];

  if (g_isWaiting[number]) {
    var waitingErrorMessage = 'Sorry, I\'m really busy right now. Hit me up later.';
    kanye.sendMessage(number, waitingErrorMessage);
    return;
  }
  g_isWaiting[number] = true;

  var service;

  if (config.DEBUG) {
    console.log('Received SMS: %s | Last service: %s', message, lastService);
  }

  if (SERVICES.getServiceFromMessage(message)) {
    service = SERVICES.getServiceFromMessage(message);

    // They have started a new service. Clear the session for the last service they were on.
    if (lastService) {
      // Note the empty function is required so the app will not crash if the
      // `/clear` endpoint does not exist.
      request(service + "/clear?number=" + number, function() {});
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

  kanye.serviceRequest(service, message, number, function(error, response, body) {
    g_isWaiting[number] = false;
    if (error || response.statusCode != 200) {
      // Send a 'try again later' message.'
      if (service === SERVICES.wolfram) {
        var errorMessage = 'Sorry, I\'m really busy right now. Hit me up later.';
        kanye.sendMessage(number, errorMessage);
      } else {
        kanye.serviceRequest(service, message, number, function(error, response, body) {
          sendBodyResult(number, body, res);
        });
      }
      return;
    }
    sendBodyResult(number, body, res);
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
      mediaUrl: media,
      body: unescape(message)
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
