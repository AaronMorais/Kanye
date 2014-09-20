/**
 * State class to handle where the user is in Hacker News
 */
var State = function() {
  this.currentArticle = 0;
  this.numSend = 5;
};

State.prototype.incrementArticleIndex = function() {
  this.currentArticle += this.numSend;
  return this.currentArticle;
};

State.prototype.getArticleIndex = function() {
  return this.currentArticle;
};

State.prototype.getNumSend = function() {
  return this.numSend;
};

State.prototype.getPageNum = function() {
  return ((this.currentArticle+1) / 40) + 1;
};

module.exports = State;
