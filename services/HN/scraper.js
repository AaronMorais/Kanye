var jsdom = require("jsdom");
var State = require("./state");
var util = require("./util");
var constants = require("./constants");

var handleScrape = function(message, number, state, callback) {
  if (!util.isValidCommand(message)) {
    callback(null, "Not a valid command");
    return;
  }

  jsdom.env({
    url: constants.serviceUrl + "/news?p=" + state.getPageNum(),
    scripts: constants.serviceScripts,
    done: function (errors, window) {
      var $ = window.$;
      var articles = $("td.title:not(:last) a");

      // Get only the text
      var articleInfo = $.map(articles, function(elem, i) {
        return {
          title: (i+1).toString() +":" + $(elem).text(),
          href: $(elem).attr("href"),
        };
      });
      state.setContentState(articleInfo);

      var reply = state.getArticleList();


      //callback(reply.join("\n"));
      callback(reply);
    }
  });
};

module.exports = {
  handleScrape: handleScrape,
};