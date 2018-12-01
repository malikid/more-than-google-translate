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

let enable, originalBody;
let fromSelected = defaultLanguages.fromLanguage;
let toSelected = defaultLanguages.toLanguage;



function sendMessageToBackground(action, data, callback) {
  if(isFunction(data)) {
    callback = data;
    data = undefined;
  }

  let message = {
    action,
    data
  };

  let argumentsToSend = [message];
  if(callback) {
    argumentsToSend.push(callback);
  }

  chrome.runtime.sendMessage.apply(this, argumentsToSend);
}



function ocrFromGoogle(image, from, to) {
  let defer = $.Deferred();

  let data = {
    image,
    from,
    to
  };

  sendMessageToBackground("ocr", data, response => {
    let {status} = response;

    if(status === SUCCESS) {
      defer.resolve(response.result);
    } else {
      defer.reject(response.error);
    }
  });

  return defer.promise();
}



function getTranslationFromGoogle(text, from, to) {
  let defer = $.Deferred();

  if(!$.trim(text)) {
    defer.resolve('');
    return defer.promise();
  }

  let data = {
    text,
    from,
    to
  };

  sendMessageToBackground("translate", data, response => {
    let {status} = response;

    if(status === SUCCESS) {
      defer.resolve(response.result);
    } else {
      defer.reject(response.error);
    }
  });

  return defer.promise();
}



function getText(node, from, to) {
  let originNode = node;

  if (node.nodeType === 3) {
    if(!node.data) {
      return node;
    } else {
      return getTranslationFromGoogle(node.data, from, to)
      .then(value => {
        node.data = value;
        return node;
      });
    }
  } else if(node.tagName === "INPUT") {
    if(node.value) {
      return getTranslationFromGoogle(node.value, from, to)
      .then(value => {
        node.value = value;
        return node;
      });
    }
    if(node.placeholder) {
      return getTranslationFromGoogle(node.placeholder, from, to)
      .then(value => {
        node.placeholder = value;
        return node;
      });
    }
  } else if(node.tagName === "IMG") {
    return ocrFromGoogle(node.src, from, to)
    .then(result => {
      if(!result) {
        return node;
      }
      let {x, y} = result.boundingPoly.vertices[0];
      let node2 = $("<div class='more-than-google-translate' style='position: relative;'>" + node.outerHTML + "<div class='text-block' style='position: absolute;top: " + y + "px;left: " + x + "px;padding: 15px;background-color: black;color: white;opacity: 0.8;'>" + result.text + "</div></div>");
      return node2;
    });
  }

  let promises = [];

  if(node = node.firstChild) do {
    promises.push(getText(node, from, to));
  } while (node = node.nextSibling);

  let defer = $.Deferred();

  $.when.apply($, promises)
    .done(function() {
      if(originNode) {
        let outerNode = $(originNode);
        outerNode.empty();
        $.each(arguments, (index, value) => {
          if(value) outerNode.append(value);
        });
        defer.resolve(outerNode);
      } else {
        defer.resolve('');
      }
    })
    .catch(error => {
      defer.reject(error);
    });

  return defer.promise();
}



function translate(body, from, to) {
  let defer = $.Deferred();
  let bodyElement = body.get(0);
  let tagName = "";

  let promises = $.map(bodyElement.childNodes, (child, index) => {
    tagName = child.tagName;
    switch(tagName) {
      case "SCRIPT":
      case "STYLE":
      case "LINK":
        let defer2 = $.Deferred();
        defer2.resolve(child);
        return defer2.promise();
      default:
        return getText(child, from, to);
    }
  });

  $.when.apply($, promises)
    .done(function() {
      body.empty();
      $.each(arguments, (index, value) => {
        if(value) body.append(value);
      });
      defer.resolve();
    })
    .catch(err => {
      console.error("Something went wrong", err);
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
  let action, data, body;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    action = message.action;

    switch(action) {

      case "switchOn":
        body = getCurrentTabContent();
        storeOriginalBody(body);

        data = message.data;
        fromSelected = data.from;
        toSelected = data.to;

        translate(body, fromSelected, toSelected)
        .done(() => {
          enable = RESET;
          sendResponse(SUCCESS);
        })
        .catch(() => sendResponse(FAILURE));
        return true;

      case "switchOff":
        body = getCurrentTabContent();
        resetContent(body, () => {
          enable = TRANSLATE;
          sendResponse(SUCCESS);
        });
        return true;

      case "getCurrentTabStatus":
        sendResponse({
          enable,
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


