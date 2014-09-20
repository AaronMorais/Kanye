var express       = require('express');
var kanye         = require('../../kanye');
var google        = require('googleapis');
var config        = require('../../config');
var redis         = require('redis');
var gmail         = google.gmail('v1');
var OAuth2Client  = google.auth.OAuth2;
var app           = express();
var redisClient   = redis.createClient();
var scopes        = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose"
];
var activeUsers   = {};

var CLIENT_ID     = config.DEBUG ? '846757558374-sjiu9cn3199qm24er1ludek0591lgj1i.apps.googleusercontent.com'
                                 : '846757558374-692q32ii9rvls9ip2sjsb5dt2p6vgc3i.apps.googleusercontent.com';
var CLIENT_SECRET = config.DEBUG ? '3q24Spyav4M5sO_7-xMcEuGf'
                                 : 'Cma4ab55ISAwIaXjBu24A94x';
var REDIRECT_URL  = config.DEBUG ? 'http://localhost:8000/oauth2callback'
                                 : 'http://www.getkanye.com/oauth2callback';

var redisTokenKey = function(userNumber) {
  return userNumber + '_' + 'tokens';
}

app.get('/auth_url', function(req, res) {
  var userNumber    = req.query.number;
  var oauth2Client  = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

  var url = oauth2Client.generateAuthUrl({
    access_type : 'offline',
    scope       : scopes
  });

  console.log('Auth url generated: %s', url);

  res.status(200).send(url);
});

app.get('/get_tokens', function(req, res) {
  var userNumber    = req.query.number;
  var redisKey      = redisTokenKey( userNumber );
  var oauth2Client  = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

  oauth2Client.getToken(req.query.code, function(err, tokens) {
    // Recall: redis only accepts string value. Be sure to parse JSON when reading.
    redisClient.set(redisKey, JSON.stringify( tokens ), function() {
      console.log('Stored tokens %s for %s', tokens, userNumber);
    });
  });
});

app.get('/clear', function(req, res) {
  var userNumber = req.query.number;
  delete activeUsers[ userNumber ];
  console.log('Gmail: cleared session for %s', userNumber);
});


var handleInbox = function(req, res, oauthClient) {
  // Setup the inbox state.
  activeUsers[ req.query.number ] = new GmailState();

  gmail.users.messages.list({
    userId: 'me',
    auth: oauthClient,
    maxResults: 5
  }, function(err, response) {
    if (err) {
      req.status(403).json({ error: 'Failed to retrieve inbox. Sorry bruh!' });
    } else {
      var messages          = response.messages;
      var nextPageToken     = response.nextPageToken;
      var outgoingMessage;

      // Record this in case they want to see more emails
      activeUsers[ req.query.number ].setNextPageToken( nextPageToken );

      // For each of the messages received, we get the details of the message.
      for (var i = 0; i < messages.length; i++) {
        gmail.users.message.get();
      }

      req.status(200).json({
        message: outgoingMessage
      });
    }
  });
};

var handleReadMessage = function(req, res, messageIndex, oauthClient) {
};

var handleSendMessage = function(req, res, message, oauthClient) {
};

app.get('/sms', function(req, res) {
  var userNumber = req.query.number;
  var message    = req.query.message;
  var redisKey   = redisTokenKey( userNumber );

  // Check if this user has authenticated.
  redisClient.get(redisKey, function(err, response) {
    if (err) {
      res.status(400).json({ error: 'Go to www.getkanye.com to access this feature.' });
    } else {
      // We have tokens, let's log them in.
      var oauthClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
      var credentials = JSON.parse( response );
      var lastState   = activeUsers[ userNumber ];

      oauthClient.setCredentials(credentials);

      if (message === 'inbox') {
        handleInbox(req, res, oauthClient);
      } else if (isNumber(message)) {
        handleReadMessage(req, res, parseInt(message, 10), oauthClient);
      } else if (message.substring(0,7) === 'compose') {
        // They want to send a message. Parse the string, ensure its valid, then try to send.
        var messageParts = message.split(' ');

        if (messageParts.length >= 3 && messageParts[0] === 'compose' &&
            kanye.isValidEmail(messageParts[1])) {
          var recipient = messageParts[1];
          var message = {
            to: messageParts[1],
            body: messageParts.slice(2).join(' ')
          }

          handleSendMessage(req, res, message, oauthClient);
        } else {
          res.status(400).json({ error: 'Sorry, that wasn\'t what I was expecting. Here\'s an example: `compose hi@getkanye.com Hi Kanye!`' });
        }
      } else {
        res.status(400).json({ error: 'So I was trying to check your email. Type `inbox` followed by a number to access a message.' });
      }
    }
  });

  res.status(200).end();
});

app.listen(3003);
