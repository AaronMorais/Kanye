var express = require('express');
var app = express();
var kanye = require("../../kanye");

// The main app can hit this when an SMS is received
app.get('/sms', function(req, res) {
  res.status(200).end();
});

app.listen(3003);
