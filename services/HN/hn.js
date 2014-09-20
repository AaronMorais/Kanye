// Print all of the news items on Hacker News
var jsdom = require("jsdom");
var State = require("./state");
var request = require('request');
var app = require("express")();

var messageEndpoint = "/sms";
var clearEndpoint = "/clear";
var baseUrl = "http://localhost:80/";

var keywords = ["hn", "more"];
var messageHelp = "Yo hit me up with dem digits of what you want to read, or " +
                  "send me \"more\" to see more good shit";

var serviceUrl = "http://news.ycombinator.com";
var serviceScripts = ["http://code.jquery.com/jquery.js"];
var activeUsers = {};

var sendText = function(message, number) {
  request(baseUrl + "sendsms?message=" + reply +
    "&number=" + encodeURIComponent(number)
  );
};

var isValidCommand = function(command) {
  // Handle a string
  if (typeof command === "string") {
    if (command in keywords) {
      return true;
    } else {
      return false;
    }
  }

  // Handle a number
  if (typeof command === "number") {
    var index = parseInt(command);
    if (index <= 5 && index >= 1) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};

var handleClear = function(req, res) {
  var user = req.query.user;
  // If no user was given or it doesn't exist in active users
  if (!user || (user && !(user in activeUsers))) {
    res.send(400);
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

  var response = handleScrape(message, number, function(reply) {
    var result = message + "\n" + messageHelp;
    sendText(result, number);
    res.status(200).end();
  });
};

var handleScrape = function(message, number, callback) {
  if (!isValidCommand(message)) {
    return res.status(400).status();
  }

  if (!(number in activeUsers)) {
    activeUsers[number] = new State();
  }

  var state = activeUsers[number];

  jsdom.env({
    url: serviceUrl + "/news?p=" + state.getPageNum(),
    scripts: serviceScripts,
    done: function (errors, window) {
      var $ = window.$;
      var articles = $("td.title:not(:last) a");

      // Grab 5 pages and increment counter
      var elements = articles.slice(
        state.getArticleIndex(),
        state.getArticleIndex()+state.getNumSend()
      );
      state.incrementArticleIndex();

      // Get only the text
      var reply = $.map(elements, function(elem) {
        return $(elem).text();
      });

      // Append the index to the front
      for (var i=0; i<reply.length; i++) {
        reply[i] = (i+1).toString() + ". " + reply[i];
      }

      callback(reply.join("\n"));
    }
  });
};

app.get(messageEndpoint, handleMessage);
app.get(clearEndpoint, handleClear);

app.listen(3001);
