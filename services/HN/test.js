var scraper = require("./scraper");
var State = require("./hnstate");
var request = require("request");
var article = require("article");

var test_articles = [
  "http://www.washingtonpost.com/blogs/the-switch/wp/2014/09/19/world-wide-web-inventor-lashes-out-at-internet-fast-lanes-its-bribery/?tid=rssfeed",
  "http://tsdr.uspto.gov/#caseNumber=75026640&caseType=SERIAL_NO&searchType=statusSearch",
  "http://www.randomhacks.net/2014/09/19/rust-lifetimes-reckless-cxx/",
  "http://www.theblackvault.com/m/articles/view/Aaron-Swartz",
  "https://github.com/vladikoff/chromeos-apk/blob/master/README.md",
  "https://github.com/Russell91/sshrc/",
];
var printObject = function(data) {
  for (var key in data) {
      if (data.hasOwnProperty(key)) { // this will check if key is owned by data object and not by any of it's ancestors
          console.log(key+': '+data[key]); // this will show each key with it's value
      }
  }
}

var state = new State();

scraper.scrapeHN("hn", 123456, state, function(reply, error) {
  if (error) {
    console.log(error);
    return;
  }
  console.log(reply);
  var url = state.getArticleLink(1);
  scraper.scrapeArticle(url, state, function(text, error) {
    console.log(text);
    console.log("ASDASDASDASDASD");
    scraper.scrapeArticle(url, state, function(text, error) {
      console.log(text);
    });
  });
});

var getArticleContent = function(href) {
  // The image url will be resolved from the `source` url
  request(href).pipe(article(href, function (err, result) {
    if (err) {
      console.log(err);
      // throw err;
    };
    console.log(result);

    // result = {
    //  title: String,
    //  text: String,
    //  image: String or null
    // };
  }));
};
/*
for (var i in test_articles) {
  getArticleContent(test_articles[i]);
  console.log("\n\n");
}*/
