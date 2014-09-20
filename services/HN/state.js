/**
 * State class to handle where the user is in Hacker News
 */
var maxTextLength = 155;
var pageLength = 40;

var State = function() {
  this.currentArticle = 0;
  this.numSend = 5;
  this.contentState = {};
};

State.prototype.getArticleIndex = function() {
  return this.currentArticle;
};

State.prototype.getPageNum = function() {
  return ((this.currentArticle+1) / 40) + 1;
};

State.prototype.setContentState = function(state) {
  this.contentState = state;
};

State.prototype.getArticleList = function() {
  var totalLength = 0;
  var titles = [];
  for (var i=this.currentArticle; i < pageLength; i++) {
    var article = this.contentState[i];
    var titleLength = article.title.length;
    // Make sure we don't go over the max
    if (titleLength + totalLength > maxTextLength) {
      break;
    }

    titles.push(article.title);
    // Add 1 to compensate for new lines
    totalLength += (article.title.length+1);
  }

  // Increment current article by the number of titles pushed
  this.currentArticle += titles.length;
  return titles.join("\n");
};

module.exports = State;
