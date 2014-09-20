var request = require("request");

module.exports = {
    sendMessage: function(number, message) {
        request("http://localhost/sendsms?message=" +
            message +
            "&number=" +
            encodeURIComponent(number));
    }
};
