/**
  Handles the state of the last gmail action made.
**/

var MAX_EMAIL_COUNT = 5;
var GmailState = function() {
  this.inboxThreadCount = 0;
  this.inboxThreads = {}; // Key is IDs, Value is objects with .subject and .body
  this.nextPageToken = '';
  this.currentIndex = 0;

  // The default mode is inbox.
  // It can change to `reading` in which case more will show more of the message.
  // It can change to `inbox` in which case more will show more of the inbox.
  this.currentMode = 'inbox';
  this.currentMessageIndex = 0; // when reading a message this keeps track of
  this.currentReadingMessageIndex = 0;
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
  for (var i = 0; i < MAX_EMAIL_COUNT; i++) {
    var displayIndex = this.currentIndex + i + 1; // the index to show. Start at 1.
    message += [displayIndex, ') ', this.inboxThreads[ displayIndex - 1 ].subject + '\n'].join('');
  }
  // Advance the index because next time we build, we want to show the NEXT n messages.
  this.currentIndex += MAX_EMAIL_COUNT;
  return message;
}

module.exports = GmailState;
