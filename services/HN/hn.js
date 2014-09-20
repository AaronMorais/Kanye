// Print all of the news items on Hacker News
var request = require("request");
var app = require("express")();

var scraper = require("./scraper");
var kanye = require("../../kanye");

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
  if (!message || !number) {
    res.status(400).end();
    return;
  }

  if (activeUsers.indexOf(number) === -1) {
    activeUsers[number] = new State();
  }

  scraper.scrapeHN(message, number, activeUsers[number], function(reply, error) {
    // TODO: Handle error properly through the state
    if (error) {
      res.status(400).end();
    }

    var result = message + "\n" + messageHelp;
    kanye.sendMessage(result, number);
    res.status(200).end();
  });
};

app.get(messageEndpoint, handleMessage);
app.get(clearEndpoint, handleClear);

app.listen(3001);
