/**
  Handles the state of the last gmail action made.
**/

var GmailState = function() {
  this.inboxThreadCount = 0;
  this.inboxThreads = {};
  this.nextPageToken = '';
};

GmailState.prototype.addEmail = function(email) {
  this.inboxThreads[ this.inboxThreadCount ] = email;
  this.inboxThreadCount++;
}

GmailState.prototype.getEmailAt = function(i) {
  return this.inboxThreads[ i ];
}

GmailState.prototype.setNextPageToken = function(token) {
  this.nextPageToken = token;
}

GmailState.prototype.buildInboxMessage = function() {
  var message = '';
  for (index in this.inboxThreads) {
    message += index + ') ' + this.inboxThreads[index].subject + '\n';
  }
  return message;
}

module.exports = GmailState;
