var express = require('express');
var app = express();
var article = require("article");
var kanye = require("../../kanye");
var request = require("request");

var STATE = {
    getState: function(number) {
        if (!this[number]) {
            this[number] = {};
        }
        return this[number];
    }
};

var isImage = function(url) {
    return  url.indexOf("jpg") != -1 ||
            url.indexOf("jpeg") != -1 ||
            url.indexOf("gif") != -1 ||
            url.indexOf("png") != -1;
};

var isImgur = function(url) {
    return url.indexOf("imgur");
}

var makeRedditRequest = function(page, number, res) {
    console.log("reddit request from " + page);
    request("http://reddit.com/top.json?limit=100",
        function(error, response, body) {
            var json = JSON.parse(body);

            var state = STATE.getState(number);
            state.page = page;

            var response = "";
            var num = page + 1;
            json.data.children = json.data.children.splice(page, 5);
            for (var x in json.data.children) {
                var child = json.data.children[x].data;
                var title = child.title;
                response += (num++) + ") " + title + "\n";
            }

            res.send(JSON.stringify({
                message: response,
                number: number
            }));
            res.status(200).end();
    });
};

// The main app can hit this when an SMS is received
app.get('/sms', function(req, res) {
    var message = req.query.message;
    var number = req.query.number;

    // If it's a number
    if (!isNaN(message)) {
        var num = parseInt(message);
        request("http://reddit.com/top.json?limit=100",
            function(error, response, body) {
                console.log("Here");
                var json = JSON.parse(body);

                var child = json.data.children[num-1].data;
                var url = child.url;

                if (isImage(url)) {
                    res.json({
                        media: url,
                        message: child.title,
                        number: number
                    });
                    res.status(200).end();
                } else if (isImgur(url)) {
                    res.json({
                        media: "i." + url + ".jpg",
                        message: child.title,
                        number: number
                    });
                    res.status(200).end();
                } else {
                    request(url).pipe(article(url, function(err, result) {
                        if (err || result.text.length <= child.title) {
                            res.send(JSON.stringify({
                                message: "Sorry, couldn't display that post.",
                                number: number
                            }));
                            return;
                        }
                        console.log(result.text);
                        res.send({
                            message: result.text.substring(0, 1500),
                            number: number
                        });
                        res.status(200).end();
                    }));
                }
        });

        return;
    }

    // The command reddit always starts at page 0
    if (message.trim().toLowerCase() == "reddit") {
        makeRedditRequest(0, number, res);

        return;
    }

    if (message.trim().toLowerCase() == "more" ||
            message.trim().toLowerCase() == "next") {
        console.log("pagination");
        var state = STATE.getState(number);
        console.log(state);
        if (typeof state.page == undefined) {
            res.status(400).end();
            return;
        }

        makeRedditRequest(state.page + 5, number, res);

        return;
    }

    // We should only get here if we couldnt handle the message
    res.status(400).end();
    return;
});

app.listen(3002);
