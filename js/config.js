var Config = (function() {

  var self = {};

  self.default = {
    fromLanguage: "荷蘭文",
    toLanguage: "繁體中文"
  };

  self.apiKeys = {
    TRANSLATION: "",
    VISION: ""
  };

  self.languageOptions = {};
  self.languageOptions["英文"] = "en";
  self.languageOptions["荷蘭文"] = "nl";
  self.languageOptions["繁體中文"] = "zh-TW";

  self.constants = {
    TRANSLATE: "翻譯吐司！",
    PROCESSING: "處理中...",
    RESET: "返回原文"
  };

  return self;

})();

