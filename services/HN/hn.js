// Print all of the news items on Hacker News
var request = require("request");
var app = require("express")();

var scraper = require("./scraper");
var USER_STATE = require("./constants").USER_STATE;
var USER_STATE_INCLUDE = false;

var messageEndpoint = "/sms";
var clearEndpoint = "/clear";
var baseUrl = "http://localhost:80/";

var messageHelp = "Yo hit me up with dem digits of what you want to read, or " +
                  "send me \"more\" to see more good shit";

var activeUsers = {};

var sendText = function(message, number) {
  request(baseUrl + "sendsms?message=" + reply +
    "&number=" + encodeURIComponent(number)
  );
};

var handleClear = function(req, res) {
  var user = req.query.user;
  // If no user was given or it doesn't exist in active users
  if (!user || (user && activeUsers.indexOf(user) === -1)) {
    res.status(400).end();
  }
  delete activeUsers[user];
  res.status(200).end();
};

var handleMessage = function(req, res) {
  var number = req.query.number;
  var message = req.query.message;

  // Invalid data set from main server
  if (!isValidCommand(message)) {
    res.status(400).end();
    return;
  }

  if (message === "hn" || message === "more") {
    if (activeUsers.indexOf(number) === -1 || message === "hn") {
      // First time using hn or restarting the state
      activeUsers[number] = new State();
    } else if (activeUsers[number].getUserState() === USER_STATE.READING
        && message === "more") {
      // Wants to read more
      var text = state.getReadingBlock();
      res.send({message: text, number: number});
    }
    var state = activeUsers[number];
    if (state.isBusy() && USER_STATE_INCLUDE) {
      res.status(400).end();
    }

    state.setUserState(USER_STATE.PENDING);
    scraper.scrapeHN(message, number, activeUsers[number], function(reply, error) {
      state.setUserState(USER_STATE.LIST);
      // TODO: Handle error properly through the state
      if (error) {
        res.status(400).end();
      }

      var result = message + "\n" + messageHelp;
      res.status(200).json({message: result, number: number});
    });

  } else if (!isNaN(message)) {
    // the message is a number
    var index = parseInt(message)-1;
    var url = state.getArticleLink(index);
    if (!url) {
      res.status(400).end();
    }

    state.setUserState(USER_STATE.PENDING);
    scraper.scrapeArticle(url, state, function(text, error) {
      state.setUserState(USER_STATE.READING);
      // TODO: Handle error properly through the state
      if (error) {
        console.log(error);
        res.status(400).end();
      }
      res.status(200).json({message: text, number: number});
    });
  }

  res.status(400).end();
};

app.get(messageEndpoint, handleMessage);
app.get(clearEndpoint, handleClear);

app.listen(3001);
