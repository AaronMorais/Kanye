var express       = require('express');
var kanye         = require('../../kanye');
var google        = require('googleapis');
var config        = require('../../config');
var redis         = require('redis');
var async         = require('async');
var GmailState    = require('./gmailstate.js');
var article       = require('article');
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
                                 : 'http://getkanye.com/oauth2callback';

var redisTokenKey = function(userNumber) {
  return kanye.normalizeNumber(userNumber) + '_' + 'tokens';
}

/**
  This endpint is called first to get an authorization URL.
  After this you can get the actual tokens you need.
**/
app.get('/auth_url', function(req, res) {
  var oauth2Client  = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

  var url = oauth2Client.generateAuthUrl({
    access_type : 'offline',
    scope       : scopes
  });

  res.status(200).send(url);
});

app.get('/get_tokens', function(req, res) {
  var userNumber    = kanye.normalizeNumber(req.query.number);
  var redisKey      = redisTokenKey( userNumber );
  var oauth2Client  = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

  oauth2Client.getToken(req.query.code, function(err, tokens) {
    // Recall: redis only accepts string value. Be sure to parse JSON when reading.
    redisClient.set(redisKey, JSON.stringify( tokens ), function() {
      console.log('-> Stored tokens in key', redisKey);
      res.status(200).end()
    });
  });
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
      console.error('Retrieving messages error: %s');
      console.error( err );

      res.status(403).json({ error: 'Failed to retrieve inbox. Sorry bruh!' });
    } else {
      var messages          = response.messages;
      var nextPageToken     = response.nextPageToken;
      var currentState      = activeUsers[ req.query.number ];

      console.log('-> Retrieving %s message(s).', messages.length);

      // Record this in case they want to see more emails
      currentState.setNextPageToken( nextPageToken );

      // API requests to get details on each of the messages
      var getMessageJobs = [];
      for (var i = 0; i < messages.length; i++) {
        var messageId = messages[i].id;

        getMessageJobs.push((function(messageId) {
          console.log('-> Create job for message %s at %s', messageId, i);
          return function(callback) {
            gmail.users.messages.get({ userId: 'me', id: messageId, auth: oauthClient },
              function(err, response) {
                if (err) return callback(err);

                var emailMessageTitle;
                var emailMessageBody;
                var emailMessage = response;

                // Find the subject line and contents of the email
                for (var j = 0; j < emailMessage.payload.headers.length; j++) {
                  if (emailMessage.payload.headers[j].name === 'Subject') {
                    emailMessageTitle = emailMessage.payload.headers[j].value;
                    if (config.DEBUG) {
                      console.log('Found subject line: %s', emailMessageTitle);
                    }
                    break;
                  }
                }
                // Find the body of the message - it will be "attached" to the email
                // It's possible that the email is composed of multiple parts. In that case
                // just get the first part.
                var messageHtml;
                if (emailMessage.payload.body.data) {
                  messageHtml = (new Buffer(emailMessage.payload.body.data, 'base64').toString('ascii'));
                } else {
                  messageHtml = (new Buffer(emailMessage.payload.parts[0].body.data, 'base64').toString('ascii'));
                }

                currentState.addEmail({ subject: emailMessageTitle, body: emailMessageBody });
                callback(null, currentState);
              });
          };
        })(messageId));
      }

      if (messages.length === 0) {
        res.status(403).json({ error: 'You have no emails in your inbox.' });
      } else {
        // Get the message contents for all messages in the inbox.
        // Keep these stored, so if we read them later we dont do another API request.
        console.log('-> Starting %s parallel jobs to retrieve messages.', getMessageJobs.length);
        async.parallel(getMessageJobs, function(err, resultStates) {


          if (err) {
            res.status(500).json({ error: 'Failed to retrieve your emails.' });
          } else {
            // This should be filled out by this point. Build the message to send.
            var outgoingMessage = currentState.buildInboxMessage();
            res.status(200).json({
              message: outgoingMessage
            });
          }
        });
      }
    }
  });
};

var handleReadMessage = function(req, res, messageIndex, oauthClient) {
};

var handleSendMessage = function(req, res, message, oauthClient) {

  var request = gmail.users.messages.send({
    'userId' : message.to,
    'message' : {
      'raw' : btoa(message.body)
    }
  }, function(err, response) {
    var outgoingMessage;
    if (err) {
      outgoingMessage = "Mail send failed.";
    } else {
      outgoingMessage = "Mail successfully sent.";
    }

    res.status(200).json({
      message: outgoingMessage
    });
  });
};

app.get('/clear', function(req, res) {
  var userNumber = req.query.number;
  delete activeUsers[ userNumber ];
  console.log('Gmail: cleared session for %s', userNumber);
});

app.get('/sms', function(req, res) {
  var userNumber  = req.query.number;
  var textMessage = req.query.message;
  var redisKey    = redisTokenKey( userNumber );

  console.log('Gmail Query')
  console.log('-> redisKey: %s | userNumber: %s | textMessage: %s',
    redisKey, userNumber, textMessage)

  // Check if this user has authenticated.
  redisClient.get(redisKey, function(err, response) {
    if (err || response == null) {
      res.status(200).json({
        message: 'Go to www.getkanye.com to access this feature.',
        number: userNumber
      });
    } else {
      // We have tokens, let's log them in.
      var oauthClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
      var credentials = JSON.parse( response );
      var message     = textMessage;

      console.log('Found GMail tokens: %o', credentials);

      oauthClient.setCredentials(credentials);

      if (message.toLowerCase() === 'inbox') {
        handleInbox(req, res, oauthClient);
      } else if (kanye.isNumber(message)) {
        handleReadMessage(req, res, parseInt(message, 10), oauthClient);
      } else if (message && message.substring(0,7).toLowerCase() === 'compose') {
        // They want to send a message. Parse the string, ensure its valid, then try to send.
        var messageParts = message.split(/\s+/);

        if (messageParts.length >= 3 && messageParts[0] === 'compose' &&
            kanye.isValidEmail(messageParts[1])) {
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
});

app.listen(3003);
