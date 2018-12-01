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

let switchElement, fromElement, toElement;
let fromSelectedLanguage, toSelectedLanguage;



function addOptionElement(element, language, anotherSelectedLanguage) {
  let isSelectedByAnotherSelector = false;
  let option = document.createElement("option");
  option.text = language;

  if(anotherSelectedLanguage && anotherSelectedLanguage === language) {
    isSelectedByAnotherSelector = true
    option.disabled = true;
  }

  element.add(option);
  return isSelectedByAnotherSelector;
}



function resetOptions(selectElement) {
  let optionLength = selectElement.options.length;
  for(let i = optionLength - 1; i >= 0; i--) {
    selectElement.remove(i);
  }
}



function setLanguageSelectors() {
  let fromSelectedIndex = 0;
  let toSelectedIndex = 1;

  languageOptionKeys = Object.keys(LANGUAGE_OPTIONS);

  resetOptions(fromElement);
  resetOptions(toElement);

  for(let i = 0, language, option; i < languageOptionKeys.length; i++) {
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

  fromElement.addEventListener("change", function() {
    fromSelectedLanguage = this.value;
    setLanguageSelectors();
  });

  toElement.addEventListener("change", function() {
    toSelectedLanguage = this.value;
    setLanguageSelectors();
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
    from: fromElement.value,
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
