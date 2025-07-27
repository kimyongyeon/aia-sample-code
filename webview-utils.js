"use strict";

// WebView 호환성을 위한 유틸리티 함수들
var WebViewUtils = (function () {
  "use strict";

  // 브라우저/WebView 정보 감지
  var detectBrowser = function () {
    var userAgent = navigator.userAgent || "";
    var info = {
      isWebView: false,
      isAndroid: false,
      isIOS: false,
      isOldWebView: false,
      version: "unknown",
    };

    // Android WebView 감지
    if (userAgent.indexOf("wv") > -1 || userAgent.indexOf("Android") > -1) {
      info.isWebView = true;
      info.isAndroid = true;

      // Android 버전 추출
      var androidMatch = userAgent.match(/Android\s*(\d+\.\d+)/);
      if (androidMatch) {
        var version = parseFloat(androidMatch[1]);
        info.version = version;
        info.isOldWebView = version < 4.4; // Android 4.4 미만은 구형 WebView
      }
    }

    // iOS WebView 감지
    if (userAgent.indexOf("Mobile") > -1 && userAgent.indexOf("Safari") > -1) {
      info.isWebView = true;
      info.isIOS = true;

      // iOS 버전 추출
      var iosMatch = userAgent.match(/OS\s*(\d+)_(\d+)/);
      if (iosMatch) {
        var version = parseFloat(iosMatch[1] + "." + iosMatch[2]);
        info.version = version;
        info.isOldWebView = version < 8.0; // iOS 8.0 미만은 구형 WebView
      }
    }

    return info;
  };

  // 기능 지원 여부 확인
  var checkFeatureSupport = function () {
    var features = {
      es6Modules: false, // ES5 환경에서는 모듈 시스템 미지원
      map: typeof Map !== "undefined",
      set: typeof Set !== "undefined",
      arrayFrom: typeof Array.from !== "undefined",
      addEventListener: typeof addEventListener !== "undefined",
      querySelector: typeof document.querySelector !== "undefined",
      classList: typeof document.createElement("div").classList !== "undefined",
      flexbox: (function () {
        var div = document.createElement("div");
        div.style.display = "flex";
        return div.style.display === "flex";
      })(),
      transform: (function () {
        var div = document.createElement("div");
        div.style.transform = "translateX(0)";
        return div.style.transform !== "";
      })(),
      transition: (function () {
        var div = document.createElement("div");
        div.style.transition = "all 0.3s";
        return div.style.transition !== "";
      })(),
    };

    return features;
  };

  // 안전한 DOM 조작 함수
  var safeDOM = {
    getElementById: function (id) {
      try {
        return document.getElementById(id);
      } catch (error) {
        console.error("getElementById 오류:", error);
        return null;
      }
    },

    querySelector: function (selector) {
      try {
        if (typeof document.querySelector !== "undefined") {
          return document.querySelector(selector);
        }
        return null;
      } catch (error) {
        console.error("querySelector 오류:", error);
        return null;
      }
    },

    querySelectorAll: function (selector) {
      try {
        if (typeof document.querySelectorAll !== "undefined") {
          return document.querySelectorAll(selector);
        }
        return [];
      } catch (error) {
        console.error("querySelectorAll 오류:", error);
        return [];
      }
    },

    addEventListener: function (element, event, handler) {
      try {
        if (element && typeof element.addEventListener !== "undefined") {
          element.addEventListener(event, handler);
          return true;
        } else if (element && typeof element.attachEvent !== "undefined") {
          element.attachEvent("on" + event, handler);
          return true;
        } else if (element) {
          element["on" + event] = handler;
          return true;
        }
        return false;
      } catch (error) {
        console.error("addEventListener 오류:", error);
        return false;
      }
    },

    removeEventListener: function (element, event, handler) {
      try {
        if (element && typeof element.removeEventListener !== "undefined") {
          element.removeEventListener(event, handler);
          return true;
        } else if (element && typeof element.detachEvent !== "undefined") {
          element.detachEvent("on" + event, handler);
          return true;
        }
        return false;
      } catch (error) {
        console.error("removeEventListener 오류:", error);
        return false;
      }
    },
  };

  // 안전한 스타일 조작 함수
  var safeStyle = {
    addClass: function (element, className) {
      try {
        if (element && element.classList) {
          element.classList.add(className);
          return true;
        } else if (element) {
          var classes = element.className.split(" ");
          if (classes.indexOf(className) === -1) {
            classes.push(className);
            element.className = classes.join(" ");
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error("addClass 오류:", error);
        return false;
      }
    },

    removeClass: function (element, className) {
      try {
        if (element && element.classList) {
          element.classList.remove(className);
          return true;
        } else if (element) {
          var classes = element.className.split(" ");
          var newClasses = [];
          for (var i = 0; i < classes.length; i++) {
            if (classes[i] !== className) {
              newClasses.push(classes[i]);
            }
          }
          element.className = newClasses.join(" ");
          return true;
        }
        return false;
      } catch (error) {
        console.error("removeClass 오류:", error);
        return false;
      }
    },

    hasClass: function (element, className) {
      try {
        if (element && element.classList) {
          return element.classList.contains(className);
        } else if (element) {
          var classes = element.className.split(" ");
          return classes.indexOf(className) !== -1;
        }
        return false;
      } catch (error) {
        console.error("hasClass 오류:", error);
        return false;
      }
    },

    setStyle: function (element, property, value) {
      try {
        if (element && element.style) {
          element.style[property] = value;
          return true;
        }
        return false;
      } catch (error) {
        console.error("setStyle 오류:", error);
        return false;
      }
    },
  };

  // 안전한 JSON 처리
  var safeJSON = {
    parse: function (text) {
      try {
        return JSON.parse(text);
      } catch (error) {
        console.error("JSON.parse 오류:", error);
        return null;
      }
    },

    stringify: function (obj) {
      try {
        return JSON.stringify(obj);
      } catch (error) {
        console.error("JSON.stringify 오류:", error);
        return "{}";
      }
    },
  };

  // 로컬 스토리지 안전 래퍼
  var safeStorage = {
    setItem: function (key, value) {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(key, value);
          return true;
        }
        return false;
      } catch (error) {
        console.error("localStorage.setItem 오류:", error);
        return false;
      }
    },

    getItem: function (key) {
      try {
        if (typeof localStorage !== "undefined") {
          return localStorage.getItem(key);
        }
        return null;
      } catch (error) {
        console.error("localStorage.getItem 오류:", error);
        return null;
      }
    },

    removeItem: function (key) {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(key);
          return true;
        }
        return false;
      } catch (error) {
        console.error("localStorage.removeItem 오류:", error);
        return false;
      }
    },
  };

  // 디바이스 정보
  var deviceInfo = {
    isTouchDevice: function () {
      try {
        return "ontouchstart" in window || navigator.maxTouchPoints > 0;
      } catch (error) {
        return false;
      }
    },

    isMobile: function () {
      try {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      } catch (error) {
        return false;
      }
    },

    getScreenSize: function () {
      try {
        return {
          width:
            window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth,
          height:
            window.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight,
        };
      } catch (error) {
        return { width: 0, height: 0 };
      }
    },
  };

  // 로깅 유틸리티
  var logger = {
    log: function (message) {
      try {
        if (typeof console !== "undefined" && console.log) {
          console.log("[WebViewUtils]", message);
        }
      } catch (error) {
        // 로깅 실패 시 무시
      }
    },

    warn: function (message) {
      try {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[WebViewUtils]", message);
        }
      } catch (error) {
        // 로깅 실패 시 무시
      }
    },

    error: function (message) {
      try {
        if (typeof console !== "undefined" && console.error) {
          console.error("[WebViewUtils]", message);
        }
      } catch (error) {
        // 로깅 실패 시 무시
      }
    },
  };

  return {
    detectBrowser: detectBrowser,
    checkFeatureSupport: checkFeatureSupport,
    DOM: safeDOM,
    Style: safeStyle,
    JSON: safeJSON,
    Storage: safeStorage,
    Device: deviceInfo,
    Logger: logger,
  };
})();

// 전역 객체에 추가
if (typeof window !== "undefined") {
  window.WebViewUtils = WebViewUtils;
}

// 자동 초기화 및 정보 로깅
(function () {
  "use strict";

  try {
    var browserInfo = WebViewUtils.detectBrowser();
    var featureSupport = WebViewUtils.checkFeatureSupport();

    WebViewUtils.Logger.log("브라우저 정보: " + JSON.stringify(browserInfo));
    WebViewUtils.Logger.log(
      "기능 지원 정보: " + JSON.stringify(featureSupport)
    );

    // 구형 WebView 감지 시 경고
    if (browserInfo.isOldWebView) {
      WebViewUtils.Logger.warn(
        "구형 WebView가 감지되었습니다. 일부 기능이 제한될 수 있습니다."
      );
    }

    // 중요 기능 미지원 시 경고
    if (!featureSupport.addEventListener) {
      WebViewUtils.Logger.warn(
        "addEventListener가 지원되지 않습니다. 이벤트 처리가 제한될 수 있습니다."
      );
    }

    if (!featureSupport.querySelector) {
      WebViewUtils.Logger.warn(
        "querySelector가 지원되지 않습니다. DOM 조작이 제한될 수 있습니다."
      );
    }
  } catch (error) {
    WebViewUtils.Logger.error("WebViewUtils 초기화 중 오류: " + error.message);
  }
})();
