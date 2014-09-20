var express = require('express');
var app = express();
var request = require('request');
var config = require("../../config");
var wolfram = require('node-wolfram');
wolfram = new wolfram(config.WOLFRAM_KEY);

var formatResult = function(result) {
	if (!result.queryresult.pod) return "";
    for(var a = 0; a < result.queryresult.pod.length; a++) {
        var pod = result.queryresult.pod[a];
        if (pod.$.title != "Input" &&
        	pod.$.title != "Input interpretation" &&
            pod.$.title != "Plot") {
            if (pod.subpod.length) {
                var subpod = pod.subpod[0];
                if (subpod.plaintext.length) {
                    return pod.$.title + ":\n" + subpod.plaintext[0];
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

    res.status(200).json({ message: formatResult(result) });
	});
});

app.listen(4000);
