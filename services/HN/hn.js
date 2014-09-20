// Print all of the news items on Hacker News
var jsdom = require("jsdom");
var State = require("./state");
var app = require("express")();

var messageEndpoint = "/hn/message/";
var clearEndpoint = "/hn/clear/";

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
  res.send(200);
};

var messageEndpoint = function(req, res) {
  var number = req.query.number;
  var message = req.query.message;

  // Invalid data set from main server
  if (!message || !number) {
    res.send(400);
  }
  var response = handleMessage(message, number);
  res.write(response);
  res.send(200);
};

var handleMessage = function(message, number) {
  if (!(number in activeUsers)) {
    activeUsers[number] = new State();
  }

  var articles;
  var state = activeUsers[number];

  jsdom.env({
    url: serviceUrl,
    scripts: serviceScripts,
    done: function (errors, window) {
      var $ = window.$;
      articles = $("td.title:not(:last) a");
      $("td.title:not(:last) a").each(function() {
        console.log($(this).text());
      });
    }
  });

  var elements = articles.slice(state.getPage(),
                                state.getPage()+state.getNumSend()
                               );
  state.incrementPage();
  return elements.map(function(elem) {
    return $(elem).text();
  });
};

app.get(messageEndpoint, handleMessage);
app.get(clearEndpoint, handleClear);

/*
jsdom.env({
  url: serviceUrl,
  scripts: serviceScripts,
  done: function (errors, window) {
    var $ = window.$;
    console.log("HN Links");
    var test = $("td.title:not(:last) a");
    test = test.splice(0, 5);
    $(test).each(function() {
      console.log($(this).text());
    });
    /*$("td.title:not(:last) a").each(function() {
      console.log($(this).text());
    });
  }
});*/

app.listen(3000);
