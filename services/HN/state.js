/**
 * State class to handle where the user is in Hacker News
 */
var State = function() {
  this.currentPage = 0;
  this.numSend = 5;
};

State.prototype.incrementPage = function() {
  this.currentPage += this.numSend;
  return this.currentPage;
};

State.prototype.getPage = function() {
  return this.currentPage;
};

State.prototype.getNumSend = function() {
  return this.numSend;
};

module.exports = State;
