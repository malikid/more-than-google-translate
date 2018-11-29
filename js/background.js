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
  var defer = $.Deferred();
  var url = "https://translation.googleapis.com/language/translate/v2?key=" + TRANSLATION_KEY;

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



function setMessageListener() {
  console.log("setMessageListener");
  var action;

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    action = message.action;

    switch(action) {

      case "translate":
        var data = message.data;
        var text = data.text;
        var from = data.from;
        var to = data.to;
        getTranslationFromGoogle(text, from, to)
        .done(function(text) {
          sendResponse({status: SUCCESS, result: text});
        })
        .catch(function(error) {
          sendResponse({status: FAILURE, error: error});
        });
        return true;
    }
  });
}



(function init() {
  setMessageListener();
})()
