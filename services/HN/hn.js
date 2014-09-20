// Print all of the news items on Hacker News
var jsdom = require("jsdom");
var State = require("./state");
var request = require('request');
var app = require("express")();

var messageEndpoint = "/message/";
var clearEndpoint = "/clear/";
var baseUrl = "http://localhost:80/";

var serviceUrl = "http://news.ycombinator.com/";
var serviceScripts = ["http://code.jquery.com/jquery.js"];
var activeUsers = {};

var handleClear = function(req, res) {
  var user = req.query.user;
  // If no user was given or it doesn't exist in active users
  if (!user || (user && !(user in activeUsers))) {
    res.send(400);
  }
  delete activeUsers[user];
  res.status(200).end();
};

var messageEndpoint = function(req, res) {
  var number = req.query.number;
  var message = req.query.message;

  // Invalid data set from main server
  if (!message || !number) {
    res.status(400).end();
    return;
  }

  var response = handleMessage(message, number, function(reply) {
    request(baseUrl + "sendsms?message=" + reply +
			"&number=" + encodeURIComponent(number)
    );
    res.status(200).end();
  });
};

var handleMessage = function(message, number, callback) {
  if (!(number in activeUsers)) {
    activeUsers[number] = new State();
  }

  var state = activeUsers[number];
  jsdom.env({
    url: serviceUrl,
    scripts: serviceScripts,
    done: function (errors, window) {
      var $ = window.$;
      var articles = $("td.title:not(:last) a");
      // Grab 5 pages and increment counter
      var elements = articles.slice(
        state.getPage(),
        state.getPage()+state.getNumSend()
      );
      state.incrementPage();

      // Get only the text
      var reply = $.map(elements, function(elem) {
        return $(elem).text();
      });
      callback(reply.join("\n"));
    }
  });
};
/* For testing purposes
handleMessage("lol", "123456", function(reply) {
  for (var i=0; i<reply.length; i++) {
    console.log(reply[i]);
  }
});*/

app.get(messageEndpoint, handleMessage);
app.get(clearEndpoint, handleClear);

app.listen(3001);
