/**
  Handles the state of the last gmail action made.
**/

var GmailState = function() {
  this.inboxThreads = {};
  this.nextPageToken = '';
};

GmailState.prototype.getEmailAt = function(i) {
  return this.inboxThreads[ i ];
}

GmailState.prototype.setNextPageToken = function(token) {
  this.nextPageToken = token;
}

module.exports = GmailState;
