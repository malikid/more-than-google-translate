/* life in the page  */
// {
//   action: ""
//   data: xxx
// }

const SUCCESS = 200, FAILURE = 500;
const CONSTANTS = Config.constants;
const TRANSLATE = CONSTANTS.TRANSLATE;
const PROCESSING = CONSTANTS.PROCESSING;
const RESET = CONSTANTS.RESET;
const defaultLanguages = Config.default;
var enable, originalBody;
var fromSelected = defaultLanguages.fromLanguage;
var toSelected = defaultLanguages.toLanguage;



function sendMessageToBackground(action, data, callback) {
  if(isFunction(data)) {
    callback = data;
    data = undefined;
  }

  var message = {
    action: action,
    data: data
  };

  var argumentsToSend = [message];
  if(callback) {
    argumentsToSend.push(callback);
  }

  chrome.runtime.sendMessage.apply(this, argumentsToSend);
}



function getTranslationFromGoogle(text, from, to) {
  var defer = $.Deferred();

  if(!$.trim(text)) {
    defer.resolve('');
    return defer.promise();
  }

  var data = {
    text: text,
    from: from,
    to: to
  };

  sendMessageToBackground("translate", data, function(response) {
    var status = response.status;

    if(status === SUCCESS) {
      defer.resolve(response.result);
    } else {
      defer.reject(response.error);
    }
  });

  return defer.promise();
}



function getText(node, from, to) {
  var originNode = node;

  if (node.nodeType === 3) {
    if(!node.data) {
      return node;
    } else {
      return getTranslationFromGoogle(node.data, from, to)
      .then(function(value) {
        node.data = value;
        return node;
      });
    }
  } else if(node.tagName === "INPUT") {
    if(node.value) {
      return getTranslationFromGoogle(node.value, from, to)
      .then(function(value) {
        node.value = value;
        return node;
      });
    }
    if(node.placeholder) {
      return getTranslationFromGoogle(node.placeholder, from, to)
      .then(function(value) {
        node.placeholder = value;
        return node;
      });
    }
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
    })
    .catch(function(error) {
      defer.reject(error);
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

        translate(body, fromSelected, toSelected)
        .done(function() {
          sendResponse(SUCCESS);
        })
        .catch(function() {
          sendResponse(FAILURE);
        });
        return true;

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
        return true;
    }
  });
}



(function init() {
  enable = TRANSLATE;
  setMessageListeners();
})()


