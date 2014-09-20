var express = require('express');
var app = express();
var request = require('request');
var wolfram = require('node-wolfram')(config.WOLFRAM_KEY);
var config = require("../../config");

var formatResult = function(result) {
	if (!result.queryresult.pod) return "";
    for(var a = 0; a < result.queryresult.pod.length; a++) {
        var pod = result.queryresult.pod[a];
        if (pod.$.title != "Input" &&
        	pod.$.title != "Input interpretation") {
            if (pod.subpod.length) {
                var subpod = pod.subpod[0];
                if (subpod.plaintext.length) {
                    return subpod.plaintext[0];
                }
            }
	    }
    }
    return "";
};

// The main app can hit this when an SMS is received
app.get('/sms', function(req, res) {
	var userQuery = req.query.message;
	wolfram.query(userQuery, function(err, result) {
		if (err) {
			res.status(400).end();
			return;
		}

		var message = formatResult(result);
		request("http://localhost:80/sendsms?message=" +
				message +
				"&number=" +
				encodeURIComponent(req.query.number));
		res.status(200).end();
	});
});

app.listen(4000);
