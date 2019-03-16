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

let switchElement, toElement;
let toSelectedLanguage;



function addOptionElement(element, language) {
  let option = document.createElement("option");
  option.text = language;
  element.add(option);
}



function setLanguageSelectors() {
  languageOptionKeys = Object.keys(LANGUAGE_OPTIONS);

  for(let i = 0, language; i < languageOptionKeys.length; i++) {
    language = languageOptionKeys[i];
    addOptionElement(toElement, language);
  }

  // Default
  toElement.selectedIndex = toSelectedIndex;
}



function init(data) {
  toSelectedLanguage = data.to;

  if(!toElement) {
    toElement = document.querySelector("select.to");
  }

  setLanguageSelectors();

  toElement.addEventListener("change", function() {
    toSelectedLanguage = this.value;
  });
}



function sendMessageToInject(action, data, callback) {
  if(isFunction(data)) {
    callback = data;
    data = undefined;
  }

  let message = {
    action,
    data
  };

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    let activeTab = tabs[0];
    if(activeTab) {
      let argumentsToSend = [activeTab.id, message];
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



// switch on/off
function clickSwitch() {
  let action;
  let switchValue = switchElement.innerHTML;
  let data = {
    to: toElement.value
  };

  if(switchValue.indexOf(RESET) != -1) {
    switchElement.innerHTML = PROCESSING;
    action = "switchOff";
  } else if(switchValue.indexOf(TRANSLATE) != -1) {
    switchElement.innerHTML = PROCESSING;
    action = "switchOn";
  } else {
    return;
  }

  sendMessageToInject(action, data, status =>
    switchElement.innerHTML = status
  );
}



(function () {

  switchElement = document.getElementById("switch");

  sendMessageToInject("getCurrentTabStatus", status => {

    switchElement.innerHTML = status.enable || TRANSLATE;
    switchElement.addEventListener("click", clickSwitch);

    init(status);
  });
})()
