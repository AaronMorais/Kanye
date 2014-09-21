var request = require("request");

module.exports = {
  serviceRequest: function(service, message, number, callback) {
    // Route the request to the proper service.
    // The service should return a JSON object `{ message: ... }` which will contain text
    // to be sent to the user.
    request(service + "/sms?message=" + message + "&number=" + encodeURIComponent(number),
      function(error, response, body) {
        callback(error, response, body);
    });
  },
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
  normalizeNumber: function(number) {
    // Remove everything except sweet digits
    if (number && typeof(number) === 'string') {
      return number.replace(/\D/g, '').trim();
    } else {
      return number;
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
