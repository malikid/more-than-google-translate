// {
//   action: ""
//   data: xxx
// }
// LANGUAGE_OPTIONS

const SUCCESS = 200, FAILURE = 500;
const LANGUAGE_OPTIONS = Config.languageOptions;
const CONSTANTS = Config.constants;
const TRANSLATE = CONSTANTS.TRANSLATE;
const PROCESSING = CONSTANTS.PROCESSING;
const RESET = CONSTANTS.RESET;

var switchElement, fromElement, toElement;
var fromSelectedLanguage, toSelectedLanguage;



function addOptionElement(element, language, anotherSelectedLanguage) {
  var isSelectedByAnotherSelector = false;
  var option = document.createElement("option");
  option.text = language;

  if(anotherSelectedLanguage && anotherSelectedLanguage === language) {
    isSelectedByAnotherSelector = true
    option.disabled = true;
  }

  element.add(option);
  return isSelectedByAnotherSelector;
}



function resetOptions(selectElement) {
  var optionLength = selectElement.options.length;
  for(var i = optionLength - 1; i >= 0; i--) {
    selectElement.remove(i);
  }
}



function setLanguageSelectors() {
  var fromSelectedIndex = 0;
  var toSelectedIndex = 1;

  languageOptionKeys = Object.keys(LANGUAGE_OPTIONS);

  resetOptions(fromElement);
  resetOptions(toElement);

  for(var i = 0, language, option; i < languageOptionKeys.length; i++) {
    language = languageOptionKeys[i];

    if(addOptionElement(fromElement, language, toSelectedLanguage)) {
      toSelectedIndex = i;
    }

    if(addOptionElement(toElement, language, fromSelectedLanguage)) {
      fromSelectedIndex = i;
    }
  }

  // Default
  fromElement.selectedIndex = fromSelectedIndex;
  toElement.selectedIndex = toSelectedIndex;
}



function init(data) {
  fromSelectedLanguage = data.from;
  toSelectedLanguage = data.to;

  if(!fromElement) {
    fromElement = document.querySelector("select.from");
  }

  if(!toElement) {
    toElement = document.querySelector("select.to");
  }

  setLanguageSelectors();

  fromElement.addEventListener("change", function(value) {
    fromSelectedLanguage = this.value;
    setLanguageSelectors();
  });

  toElement.addEventListener("change", function(value) {
    toSelectedLanguage = this.value;
    setLanguageSelectors();
  });
}



function sendMessageToInject(action, data, callback) {
  console.log("sendMessageToInject");

  if(isFunction(data)) {
    callback = data;
    data = undefined;
  }

  var message = {
    action: action,
    data: data
  };

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    if(activeTab) {
      var argumentsToSend = [activeTab.id, message];
      if(callback) {
        argumentsToSend.push(callback);
      }
      chrome.tabs.sendMessage.apply(this, argumentsToSend);
    }
  });
}



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



// switch on/off
function clickSwitch() {
  var action, valueToSet;
  var switchValue = switchElement.innerHTML;
  var data = {
    from: fromElement.value,
    to: toElement.value
  };

  if(switchValue.indexOf(RESET) != -1) {
    switchElement.innerHTML = PROCESSING;
    action = "switchOff";
    valueToSet = TRANSLATE;
  } else if(switchValue.indexOf(TRANSLATE) != -1) {
    switchElement.innerHTML = PROCESSING;
    action = "switchOn";
    valueToSet = RESET;
  } else {
    return;
  }

  sendMessageToInject(action, data, function(status) {
    if(status === SUCCESS) {
      switchElement.innerHTML = valueToSet;
    } else {
      switchElement.innerHTML = !valueToSet;
    }
  });
}



(function () {
  var enable;

  switchElement = document.getElementById("switch");

  sendMessageToInject("getCurrentTabStatus", function(status) {
    enable = status.enable;

    if(enable === undefined) {
      enable = TRANSLATE;
    }
    
    switchElement.innerHTML = enable;
    switchElement.addEventListener("click", clickSwitch);

    init(status);
  });
})()
