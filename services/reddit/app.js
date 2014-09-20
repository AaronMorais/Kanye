var express = require('express');
var app = express();
var kanye = require("../../app");

// The main app can hit this when an SMS is received
app.get('/sms', function(req, res) {
    if (req.query.message.toLowerCase() != "reddit") {
        res.status(400).end();
        return;
    }

    kanye.sendMessage(req.query.number, "You're now browsing reddit!");
    res.status(200).end()
});

app.listen(3002);
