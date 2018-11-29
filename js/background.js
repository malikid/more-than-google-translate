/* life in the browser  */
// {
//   action: ""
//   data: xxx
// }

const SUCCESS = 200, FAILURE = 500;
const LANGUAGE_OPTIONS = Config.languageOptions;
const KEY = Config.apiKey;



function ocrFromGoogle(image, to) {
  let defer = $.Deferred();
  let url = "https://vision.googleapis.com/v1/images:annotate?key=" + KEY;

  $.ajax({
    url,
    type: "POST",
    contentType:"application/json; charset=utf-8",
    dataType:"json",
    data: JSON.stringify({
      requests: [
        {
          image: {
            source: {
              imageUri: image
            }
          },
          features: [
            {
              type: 'TEXT_DETECTION'
            }
          ]
        }
      ]
    }),
    success: data => {
      if($.isEmptyObject(data.responses[0])) {
        return defer.resolve();
      }
      let detectedTextObj = data.responses[0].textAnnotations[0];
      getTranslationFromGoogle(detectedTextObj.description, detectedTextObj.locale, to)
      .done(result => defer.resolve({
          text: result,
          boundingPoly: detectedTextObj.boundingPoly
        })
      )
      .catch(error => defer.reject(error));
    },
    fail: error => {
      defer.reject(error);
    }
  });
  // Test Only
  // defer.resolve('');

  return defer.promise();
}



function getTranslationFromGoogle(text, from, to) {
  let defer = $.Deferred();
  let url = "https://translation.googleapis.com/language/translate/v2?key=" + KEY;

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

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let action = message.action;
    let {data} = message;
    let {image, text, from, to} = data;

    switch(action) {

      case "translate":
        getTranslationFromGoogle(text, from, to)
        .done(result => sendResponse({status: SUCCESS, result}))
        .catch(error => sendResponse({status: FAILURE, error}));
        return true;

      case "ocr":
        ocrFromGoogle(image, to)
        .done(result => sendResponse({status: SUCCESS, result}))
        .catch(error => sendResponse({status: FAILURE, error}));
        return true;
    }
  });
}



(function init() {
  setMessageListener();
})()
