var express = require('express');
var app = express();
var request = require('request');
var config = require("../../config");
var wolfram = require('node-wolfram');

wolfram = new wolfram(config.WOLFRAM_KEY);

var shouldFilterOutTitle = function(title) {
  return title === 'Response' ||
         title === 'Result';
}

var formatResult = function(result) {
	if (!result.queryresult.pod) return '';
  for (var a = 0; a < result.queryresult.pod.length; a++) {
    var pod = result.queryresult.pod[a];
    if (pod &&
        pod.$.title != "Input" &&
        pod.$.title != "Input interpretation" &&
        pod.$.title != "Input information" &&
        pod.$.title != "Plot" &&
        pod.subpod.length &&
        pod.subpod[0] &&
        pod.subpod[0].plaintext.length) {
      var title   = pod.$.title;
      var answer  = pod.subpod[0].plaintext[0];

      // Some title don't make sense to add. Filter them out there.
      var resultString = shouldFilterOutTitle(title) ? answer : title + ':\n' + answer;
      resultString = resultString.replace("Wolfram|Alpha", "Kanye");
      return resultString;
    }
  }
  return '';
};

var getWolframResult = function(userQuery, callback) {
  wolfram.query(userQuery, function(err, result) {
    if (err) {
      return '';
    }

    if (result.queryresult &&
        !result.queryresult.didyoumeans) {
      var outgoingMessage = formatResult(result);
      callback(outgoingMessage);
    } else {
      var newQuery = result.queryresult.didyoumeans[0].didyoumean[0]._;
      getWolframResult(newQuery, callback);
    }
  });
}

// The main app can hit this when an SMS is received
app.get('/sms', function(req, res) {
  var userQuery = req.query.message;

  getWolframResult(userQuery, function(result) {
    if (result === '') {
      res.status(200).json({ message: 'Sorry, I don\'t have an answer for that.' });
    } else {
      res.status(200).json({ message: result });
    }
  });
});

app.listen(4000);
