var keywords = ["hn", "more"];

var isValidCommand = function(command) {
  // Handle a string
  if (typeof command === "string" && isNaN(command)) {
    if (keywords.indexOf(command.toLowerCase()) > -1) {
      return true;
    } else {
      return false;
    }
  } else if (!isNaN(command)) {
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
