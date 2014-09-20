var keywords = ["hn", "more"];

var isValidCommand = function(command) {
  // Handle a string
  if (typeof command === "string") {
    if (keywords.indexOf(command) > -1) {
      return true;
    } else {
      return false;
    }
  }
  if (typeof command === "number") {
    return true;
  }
  return false;
};

var createListResponse = function(data) {
  var titles = [];
  for (var i in data) {
    titles.push(data[i].title);
  }
  return titles.join("\n");
};

module.exports = {
  isValidCommand: isValidCommand,
  createListResponse: createListResponse,
};
