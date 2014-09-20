/**
 * State class to handle where the user is in Hacker News
 */
var USER_STATE = require("./constants").USER_STATE;
var maxTextLength = 1500;
var pageLength = 30;
var pageIncr = 5;

var State = function() {
  this.currentArticle = 0;
  this.numSend = 5;
  this.contentState = {};
  this.articleText = null;
  this.userState = USER_STATE.LIST;
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

State.prototype.setUserState = function(state) {
  this.userState = state;
}

State.prototype.getUserState = function(state) {
  return this.userState;
}

State.prototype.setReadingText = function(text) {
  this.articleText = text;
}

State.prototype.getArticleList = function() {
  var totalLength = 0;
  var titles = [];
  for (var i=this.currentArticle; i < this.currentArticle+pageIncr; i++) {
    var article = this.contentState[i % pageLength];
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

/**
 * Returns a chunk of the article text and then slices
 * the old one
 */
State.prototype.getReadingBlock = function() {
  var text = this.articleText;
  var start = text.length > maxTextLength ? maxTextLength-1 : text.length-1;
  for (var i=start; i>start-20; i--) {
    // Check for punctuation points
    if (text[i].match(/[\s\,\.\;\:]/g)) {
      break;
    }
  }
  var reply = text.slice(0, i);
  this.articleText = text.slice(i);
  return reply;
};

State.prototype.getArticleLink = function(index) {
  if (index >= this.contentState.length || index < 0) {
    return null;
  }
  return this.contentState[index].href;
};

State.prototype.isBusy = function() {
  return this.userState === USER_STATE.PENDING;
}

module.exports = State;
