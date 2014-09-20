var express = require('express');
var app = express();
var kanye = require("../../kanye");
var request = require("request");

// The main app can hit this when an SMS is received
app.get('/sms', function(req, res) {
    if (req.query.message.toLowerCase() != "reddit") {
        res.status(400).end();
        return;
    }

    request("http://reddit.com/top.json", function(error, response, body) {
        var json = JSON.parse(body);

        var response = "";
        for (var x in json.data.children) {
            var child = json.data.children[x].data;
            var title = child.title;
            response += title + "\n";
        }

        kanye.sendMessage(req.query.number, response);
        res.status(200).end();
    });

    // kanye.sendMessage(req.query.number, "You're now browsing reddit!");
});

app.listen(3002);
