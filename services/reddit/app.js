var express = require('express');
var app = express();
var kanye = require("../../kanye");
var request = require("request");

// The main app can hit this when an SMS is received
app.get('/sms', function(req, res) {
    var message = req.query.message;

    // Allow for numbers to get through
    if (isNaN(message) && message.toLowerCase() != "reddit") {
        res.status(400).end();
        return;
    }

    if (!isNaN(message)) {
        var num = parseInt(message);
        request("http://reddit.com/top.json?limit=5",
            function(error, response, body) {
                var json = JSON.parse(body);

                var child = json.data.children[num-1];
                var url = child.url;

                kanye.sendMessage(req.query.number, null, url);
        });

        return;
    }

    request("http://reddit.com/top.json?limit=5",
        function(error, response, body) {
            console.log(body);
            var json = JSON.parse(body);

            var response = "";
            var num = 1;
            for (var x in json.data.children) {
                var child = json.data.children[x].data;
                var title = child.title;
                response += (num++) + ".) " + title + "\n";
            }

            console.log(response.length);
            kanye.sendMessage(req.query.number, response);
            res.status(200).end();
    });

    // kanye.sendMessage(req.query.number, "You're now browsing reddit!");
});

app.listen(3002);
