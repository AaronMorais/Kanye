var request = require("request");

module.exports = {
    sendMessage: function(number, message) {
        request("http://localhost:80/sendsms?message=" +
            message +
            "&number=" +
            encodeURIComponent(number));
    }
};
