var express = require('express');
var app = express();
var request = require('request');

var adviceArray = ["I am God's vessel. But my greatest pain in life is that I will never be able to see myself perform live.",
"Would you believe in what you believe in if you were the only one who believed it?"];
var currentAdvice = 0;
var adviceMax = adviceArray.length;

function getAdvice() {
    var message = adviceArray[currentAdvice]; 
    currentAdvice++;
    if (currentAdvice >= adviceMax) {
        currentAdvice = 0;
    }
    return message;
}

// The main app can hit this when an SMS is received
app.get('/sms', function(req, res) {
    var message = getAdvice();
	request("http://localhost:80/sendsms?message=" +
			message +
			"&number=" +
			req.query.number);
	res.status(200).end()
});

app.listen(3000);
