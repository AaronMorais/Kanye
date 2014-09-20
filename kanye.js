var request = require("request");

module.exports = {
    sendMessage: function(number, message, media) {
        if (media) {
            request("http://localhost/sendsms?media=" +
                media +
                "&number=" +
                encodeURIComponent(number));
        } else {
            request("http://localhost/sendsms?message=" +
                message +
                "&number=" +
                encodeURIComponent(number));
        }
    }
};
