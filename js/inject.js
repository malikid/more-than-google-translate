/* life in the page  */
// {
//   action: ""
//   data: xxx
// }

const SUCCESS = 200, FAILURE = 500;
const LANGUAGE_OPTIONS = Config.languageOptions;
const CONSTANTS = Config.constants;
const TRANSLATE = CONSTANTS.TRANSLATE;
const PROCESSING = CONSTANTS.PROCESSING;
const RESET = CONSTANTS.RESET;
const defaultLanguages = Config.default;
var enable, originalBody;
var fromSelected = defaultLanguages.fromLanguage;
var toSelected = defaultLanguages.toLanguage;



function getTranslationFromGoogle(text, from, to) {
  var defer = $.Deferred();

  if(!$.trim(text)) {
    defer.resolve('');
    return defer.promise();
  }

  var url = "https://translation.googleapis.com/language/translate/v2?key=AIzaSyAz54FH21Qkyhn9qBp7XVW2LsXVMKanAfM";

  $.post(url, {
    'q': text,
    'source': LANGUAGE_OPTIONS[from],
    'target': LANGUAGE_OPTIONS[to],
    'format': 'text'
  }, function(data) {
    defer.resolve(data.data.translations[0].translatedText);
  }, "json");
  // Test Only
  // defer.resolve('aaa');

  return defer.promise();
}

function getText(node, from, to) {
  var originNode = node;

  if (node.nodeType === 3) {
    if(!node.data) {
      return node;
    } else {
      return getTranslationFromGoogle(node.data, from, to).then(function(value) {
        node.data = value;
        return node;
      });
    }
  } else if(node.tagName === "INPUT") {
    return getTranslationFromGoogle(node.value, from, to).then(function(value) {
      node.value = value;
      return node;
    });
  }

  var promises = [];

  if (node = node.firstChild) do {
    promises.push(getText(node, from, to));
  } while (node = node.nextSibling);

  var defer = $.Deferred();

  $.when.apply($, promises)
    .done(function() {
      if(originNode) {
        var outerNode = $(originNode);
        outerNode.empty();
        $.each(arguments, function(index, value) {
          if(value) outerNode.append(value);
        });
      }
      defer.resolve(outerNode);
    });

  return defer.promise();
}


function translate(body, from, to) {
  var defer = $.Deferred();
  var bodyElement = body.get(0);
  var tagName = ""; 

  var promises = $.map(bodyElement.childNodes, function(child, index) {
    tagName = child.tagName;
    switch(tagName) {
      case "SCRIPT":
      case "STYLE":
      case "LINK":
        var defer2 = $.Deferred();
        defer2.resolve(child);
        return defer2.promise();
      default:
        return getText(child, from, to);
    }
  });

  $.when.apply($, promises)
    .done(function() {
      body.empty();
      $.each(arguments, function(index, value) {
        if(value) body.append(value);
      });
      defer.resolve();
    })
    .catch(function(err) {
      console.log("Something went wrong", err);
      defer.reject(err);
    });
  return defer.promise();
}



function resetContent(body, cb) {
  body.empty().append($(originalBody));
  cb(SUCCESS);
}



function storeOriginalBody(body) {
  originalBody = body.html();
}



function getCurrentTabContent(cb) {
  return $("body");
}



function setMessageListeners() {
  console.log("setMessageListeners");
  var action, data, body;

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    action = message.action;

    switch(action) {

      case "switchOn":
        body = getCurrentTabContent();
        storeOriginalBody(body);

        data = message.data;
        fromSelected = data.from;
        toSelected = data.to;

        translate(body, fromSelected, toSelected).then(function() {
          sendResponse(SUCCESS);
          return true;
        });
        // break;

      case "switchOff":
        body = getCurrentTabContent();
        resetContent(body, function() {
          enable = TRANSLATE;
          sendResponse(SUCCESS);
        });
        return true;

      case "getCurrentTabStatus":
        sendResponse({
          enable: enable,
          from: fromSelected,
          to: toSelected
        });
        // return true;
        break;
    }
  });
}



(function init() {
  enable = TRANSLATE;
  setMessageListeners();
})()


