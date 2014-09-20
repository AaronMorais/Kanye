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
	if (!result.queryresult.pod) return "";
  for (var a = 0; a < result.queryresult.pod.length; a++) {
    var pod = result.queryresult.pod[a];
    if (pod &&
        pod.$.title != "Input" &&
        pod.$.title != "Input interpretation" &&
        pod.$.title != "Plot" &&
        pod.subpod.length &&
        pod.subpod[0] &&
        pod.subpod[0].plaintext &&
        pod.subpod[0].plaintext.length) {
      var title   = pod.$.title;
      var answer  = pod.subpod.plaintext[0];

      // Some title don't make sense to add. Filter them out there.
      return shouldFilterOutTitle(title) ? answer : title + ':\n' + answer;
    }
  }
  return "";
};

// The main app can hit this when an SMS is received
app.get('/sms', function(req, res) {
	var userQuery = req.query.message;
	wolfram.query(userQuery, function(err, result) {
    var outgoingMessage = formatResult(result);

		if (err) {
			res.status(400).end();
			return;
		}

    if (outgoingMessage === '') {
      res.status(200).json({ message: 'Sorry, I don\'t have an answer for that.' });
    } else {
      res.status(200).json({ message: formatResult(result) });
    }
  });
});

app.listen(4000);
