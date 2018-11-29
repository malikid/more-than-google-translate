/* life in the browser  */
// {
//   action: ""
//   data: xxx
// }

const SUCCESS = 200, FAILURE = 500;
const LANGUAGE_OPTIONS = Config.languageOptions;
const KEYS = Config.apiKeys;
const TRANSLATION_KEY = KEYS.TRANSLATION;
const VISION_KEY = KEYS.VISION;



function getTranslationFromGoogle(text, from, to) {
  let defer = $.Deferred();
  let url = "https://translation.googleapis.com/language/translate/v2?key=" + TRANSLATION_KEY;

  $.post(url, {
    'q': text,
    'source': LANGUAGE_OPTIONS[from],
    'target': LANGUAGE_OPTIONS[to],
    'format': 'text'
  }, data => defer.resolve(data.data.translations[0].translatedText), "json");
  // Test Only
  // defer.resolve('aaa');

  return defer.promise();
}



function setMessageListener() {
  console.log("setMessageListener");
  let action;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    action = message.action;

    switch(action) {

      case "translate":
        let {data} = message;
        let {text, from, to} = data;
        getTranslationFromGoogle(text, from, to)
        .done(result => sendResponse({status: SUCCESS, result}))
        .catch(error => sendResponse({status: FAILURE, error}));
        return true;
    }
  });
}



(function init() {
  setMessageListener();
})()
