/* life in the browser  */
// {
//   action: ""
//   data: xxx
// }

const SUCCESS = 200, FAILURE = 500;
const LANGUAGE_OPTIONS = Config.languageOptions;
const KEY = Config.apiKey;



function setImageObject(image) {
  if(image.startsWith("data:image/")) {
    return {
      content: image.split(",")[1]
    };
  }

  if(image.startsWith("//")) {
    image = "http:" + image;
  }

  return {
    source: {
      imageUri: image
    }
  };
}



function ocrFromGoogle(img, to) {
  let defer = $.Deferred();
  let url = "https://vision.googleapis.com/v1/images:annotate?key=" + KEY;

  let image = setImageObject(img);

  $.ajax({
    url,
    type: "POST",
    contentType:"application/json; charset=utf-8",
    dataType:"json",
    data: JSON.stringify({
      requests: [
        {
          image,
          features: [
            {
              type: 'TEXT_DETECTION'
            }
          ]
        }
      ]
    }),
    success: data => {
      let resultObj = data.responses[0];
      if($.isEmptyObject(resultObj)) {
        return defer.resolve();
      }
      if(resultObj.error) {
        return defer.reject(resultObj.error);
      }
      let detectedTextObj = resultObj.textAnnotations[0];
      getTranslationFromGoogle(detectedTextObj.description, to)
      .done(result =>
        defer.resolve({
          text: result,
          boundingPoly: detectedTextObj.boundingPoly
        })
      )
      .catch(error => defer.reject(error));
    },
    fail: error => defer.reject(error)
  });
  // Test Only
  // defer.resolve('');

  return defer.promise();
}



function getTranslationFromGoogle(text, to) {
  let defer = $.Deferred();
  let url = "https://translation.googleapis.com/language/translate/v2?key=" + KEY;

  $.post(url, {
    'q': text,
    'target': LANGUAGE_OPTIONS[to],
    'format': 'text'
  }, data => defer.resolve(data.data.translations[0].translatedText), "json");
  // Test Only
  // defer.resolve('aaa');

  return defer.promise();
}



function setMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let action = message.action;
    let {data} = message;
    let {image, text, to} = data;

    switch(action) {

      case "translate":
        getTranslationFromGoogle(text, to)
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
