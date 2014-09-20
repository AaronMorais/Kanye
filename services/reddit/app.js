var express = require('express');
var app = express();
var article = require("article");
var kanye = require("../../kanye");
var request = require("request");

var STATE = {};

var isImage = function(url) {
    return  url.indexOf("jpg") != -1 ||
            url.indexOf("jpeg") != -1 ||
            url.indexOf("gif") != -1 ||
            url.indexOf("png") != -1;
}

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
        request("http://reddit.com/top.json?limit=100",
            function(error, response, body) {
                console.log("Here");
                var json = JSON.parse(body);

                var child = json.data.children[num-1].data;
                var url = child.url;

                if (isImage(url)) {
                    res.send(JSON.stringify({
                        media: url,
                        number: req.query.number
                    }));
                } else {
                    request(url).pipe(article(url, function(err, result) {
                      if (err) {
                        res.send(JSON.stringify({
                            message: "Sorry, couldn't display that post.",
                            number: req.query.number
                        }));
                        return;
                      }
                      console.log(result);
                      console.log(result.text);
                      // state.setReadingText(result.text);
                      // var articleBlock = state.getReadingBlock();
                      // callback(articleBlock);
                    }));
                }
        });

        return;
    }

    request("http://reddit.com/top.json?limit=100",
        function(error, response, body) {
            var json = JSON.parse(body);

            var response = "";
            var num = 1;

            json.data.children = json.data.children.splice(0, 5);
            for (var x in json.data.children) {
                var child = json.data.children[x].data;
                var title = child.title;
                response += (num++) + ".) " + title + "\n";
            }

            console.log(response.length);
            // kanye.sendMessage(req.query.number, response);
            res.send(JSON.stringify({
                message: response,
                number: req.query.number
            }));
            res.status(200).end();
    });

    // kanye.sendMessage(req.query.number, "You're now browsing reddit!");
});

app.listen(3002);
