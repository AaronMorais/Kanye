// Print all of the news items on Hacker News
var request = require("request");
var app = require("express")();

var scraper = require("./scraper");
var USER_STATE = require("./constants").USER_STATE;
var util = require("./util");
var State = require("./hnstate");
var USER_STATE_INCLUDE = false;

var messageEndpoint = "/sms";
var clearEndpoint = "/clear";

var listMessageHelp = "Yo hit me up with dem digits of what you want to read, or " +
                  "send me \"more\" to see more good shit";
var articleMessageHelp = "Reply me \"more\" for more good sh*t";

var activeUsers = {};

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

  if (!util.isValidCommand(message)) {
    console.log("Invalid command");
    res.status(400).end();
    return;
  }

  if (message.toLowerCase() === "hn" || message.toLowerCase() === "more") {
    if (!activeUsers[number] || message === "hn") {
      // First time using hn or restarting the state
      activeUsers[number] = new State();

    } else if (activeUsers[number].getUserState() === USER_STATE.READING
        && message === "more") {
      var state = activeUsers[number];
      // Wants to read more
      var text = state.getReadingBlock() + "\n" + articleMessageHelp;
      console.log("Reading more");
      res.send({message: text});
    }
    var state = activeUsers[number];
    if (state.isBusy() && USER_STATE_INCLUDE) {
      console.log("User is busy receiving something");
      res.status(400).end();
      return;
    }

    state.setUserState(USER_STATE.PENDING);
    scraper.scrapeHN(message, number, activeUsers[number], function(reply, error) {
      state.setUserState(USER_STATE.LIST);
      // TODO: Handle error properly through the state
      if (error) {
        console.log("Error scraping HN");
        res.status(400).end();
        return;
      }

      var result = reply + "\n" + listMessageHelp;
      console.log(result, "Sending a text");
      res.status(200).json({message: result});
    });

  } else if (!isNaN(message)) {
    // the message is a number, must zero index
    var state = activeUsers[number];
    var index = parseInt(message)-1;
    var url = state.getArticleLink(index);
    if (!url) {
      console.log("Url can't be found");
      res.status(400).end();
      return;
    }

    state.setUserState(USER_STATE.PENDING);
    scraper.scrapeArticle(url, state, function(text, error) {
      state.setUserState(USER_STATE.READING);
      // TODO: Handle error properly through the state
      if (error) {
        console.log(error);
        res.status(400).end();
        return;
      }
      console.log(text);
      res.status(200).json({message: text});
    });
  }
};

app.get(messageEndpoint, handleMessage);
app.get(clearEndpoint, handleClear);

app.listen(3001);
