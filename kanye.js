var request = require("request");

module.exports = {

    sendMessage: function(number, message, media) {
        if (media) {
            console.log("Got sendMessage with MMS");
            request("http://localhost/sendsms?media=" +
                media +
                "&number=" +
                encodeURIComponent(number) + "&message=" + message);
        } else {
            request("http://localhost/sendsms?message=" +
                message +
                "&number=" +
                encodeURIComponent(number));
    }
  },
  isNumber: function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },
  isValidEmail: function(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  },
};
