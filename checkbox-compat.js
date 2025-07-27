"use strict";

// WebView 호환성을 위한 기능 감지 및 폴백
var WebViewCompat = (function () {
  "use strict";

  // 기능 감지 함수들
  var isMapSupported = typeof Map !== "undefined";
  var isArrayFromSupported = typeof Array.from !== "undefined";
  var isAddEventListenerSupported = typeof addEventListener !== "undefined";

  // Map 폴백 구현
  var createMap = function () {
    if (isMapSupported) {
      return new Map();
    } else {
      // 간단한 Map 폴백 구현
      var map = {};
      return {
        set: function (key, value) {
          map[key] = value;
        },
        get: function (key) {
          return map[key];
        },
        has: function (key) {
          return key in map;
        },
        forEach: function (callback) {
          for (var key in map) {
            if (map.hasOwnProperty(key)) {
              callback(map[key], key);
            }
          }
        },
        values: function () {
          var values = [];
          for (var key in map) {
            if (map.hasOwnProperty(key)) {
              values.push(map[key]);
            }
          }
          return values;
        },
      };
    }
  };

  // Array.from 폴백
  var arrayFrom = function (arrayLike) {
    if (isArrayFromSupported) {
      return Array.from(arrayLike);
    } else {
      return Array.prototype.slice.call(arrayLike);
    }
  };

  // 이벤트 리스너 추가 함수
  var addEvent = function (element, event, handler) {
    if (isAddEventListenerSupported) {
      element.addEventListener(event, handler);
    } else {
      // 구형 브라우저를 위한 폴백
      if (element.attachEvent) {
        element.attachEvent("on" + event, handler);
      } else {
        element["on" + event] = handler;
      }
    }
  };

  // DOM 요소 찾기 함수
  var getElementById = function (id) {
    var element = document.getElementById(id);
    if (!element) {
      console.warn('Element with id "' + id + '" not found');
    }
    return element;
  };

  // querySelector 폴백
  var querySelector = function (selector) {
    if (typeof document.querySelector !== "undefined") {
      return document.querySelector(selector);
    } else {
      // 간단한 폴백 (ID 선택자만 지원)
      if (selector.indexOf("#") === 0) {
        return getElementById(selector.substring(1));
      }
      return null;
    }
  };

  var querySelectorAll = function (selector) {
    if (typeof document.querySelectorAll !== "undefined") {
      return document.querySelectorAll(selector);
    } else {
      // 간단한 폴백
      return [];
    }
  };

  return {
    createMap: createMap,
    arrayFrom: arrayFrom,
    addEvent: addEvent,
    getElementById: getElementById,
    querySelector: querySelector,
    querySelectorAll: querySelectorAll,
  };
})();

// WebView 호환 체크박스 관리자
var CheckboxManagerCompat = (function () {
  "use strict";

  function CheckboxManagerCompat() {
    this.checkboxes = WebViewCompat.createMap();
    this.selectAllCheckbox = WebViewCompat.getElementById("selectAll");
    this.selectedItemsContainer = WebViewCompat.getElementById("selectedItems");

    if (!this.selectAllCheckbox || !this.selectedItemsContainer) {
      console.error("필수 DOM 요소를 찾을 수 없습니다.");
      return;
    }

    this.init();
  }

  CheckboxManagerCompat.prototype.init = function () {
    try {
      // 모든 체크박스 요소들을 수집
      var checkboxElements = WebViewCompat.querySelectorAll(
        'input[type="checkbox"]'
      );
      var self = this;

      for (var i = 0; i < checkboxElements.length; i++) {
        var checkbox = checkboxElements[i];
        if (checkbox.id !== "selectAll") {
          this.checkboxes.set(checkbox.id, checkbox);
          this.setupCheckboxEvent(checkbox);
        }
      }

      // 전체 선택/해제 이벤트 설정
      var self = this;
      WebViewCompat.addEvent(this.selectAllCheckbox, "change", function (e) {
        var target = e.target || e.srcElement;
        self.toggleAllCheckboxes(target.checked);
      });

      // 버튼 이벤트 설정
      this.setupButtonEvents();

      // 초기 상태 업데이트
      this.updateSelectAllState();

      console.log("체크박스 관리자가 초기화되었습니다.");
    } catch (error) {
      console.error("체크박스 관리자 초기화 중 오류 발생:", error);
    }
  };

  CheckboxManagerCompat.prototype.setupCheckboxEvent = function (checkbox) {
    var self = this;
    WebViewCompat.addEvent(checkbox, "change", function (e) {
      var target = e.target || e.srcElement;
      self.updateCheckboxItemStyle(target);
      self.updateSelectAllState();
      self.updateSelectedItemsDisplay();
    });
  };

  CheckboxManagerCompat.prototype.setupButtonEvents = function () {
    var self = this;

    // 선택된 항목 확인 버튼
    var getSelectedBtn = WebViewCompat.getElementById("getSelected");
    if (getSelectedBtn) {
      WebViewCompat.addEvent(getSelectedBtn, "click", function () {
        var selectedItems = self.getSelectedItems();
        self.showSelectedItems(selectedItems);
      });
    }

    // 랜덤 선택 버튼
    var selectRandomBtn = WebViewCompat.getElementById("selectRandom");
    if (selectRandomBtn) {
      WebViewCompat.addEvent(selectRandomBtn, "click", function () {
        self.selectRandomItems();
      });
    }

    // 모두 해제 버튼
    var clearAllBtn = WebViewCompat.getElementById("clearAll");
    if (clearAllBtn) {
      WebViewCompat.addEvent(clearAllBtn, "click", function () {
        self.clearAllCheckboxes();
      });
    }
  };

  CheckboxManagerCompat.prototype.updateCheckboxItemStyle = function (
    checkbox
  ) {
    try {
      var item = this.findParentElement(checkbox, "checkbox-item");
      if (item) {
        if (checkbox.checked) {
          this.addClass(item, "checked");
        } else {
          this.removeClass(item, "checked");
        }
      }
    } catch (error) {
      console.error("스타일 업데이트 중 오류:", error);
    }
  };

  CheckboxManagerCompat.prototype.findParentElement = function (
    element,
    className
  ) {
    while (element && element.parentElement) {
      if (this.hasClass(element.parentElement, className)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
    return null;
  };

  CheckboxManagerCompat.prototype.hasClass = function (element, className) {
    if (element.classList) {
      return element.classList.contains(className);
    } else {
      var classes = element.className.split(" ");
      for (var i = 0; i < classes.length; i++) {
        if (classes[i] === className) {
          return true;
        }
      }
      return false;
    }
  };

  CheckboxManagerCompat.prototype.addClass = function (element, className) {
    if (element.classList) {
      element.classList.add(className);
    } else {
      if (!this.hasClass(element, className)) {
        element.className += " " + className;
      }
    }
  };

  CheckboxManagerCompat.prototype.removeClass = function (element, className) {
    if (element.classList) {
      element.classList.remove(className);
    } else {
      var classes = element.className.split(" ");
      var newClasses = [];
      for (var i = 0; i < classes.length; i++) {
        if (classes[i] !== className) {
          newClasses.push(classes[i]);
        }
      }
      element.className = newClasses.join(" ");
    }
  };

  CheckboxManagerCompat.prototype.updateSelectAllState = function () {
    try {
      var allCheckboxes = WebViewCompat.arrayFrom(this.checkboxes.values());
      var checkedCount = 0;

      for (var i = 0; i < allCheckboxes.length; i++) {
        if (allCheckboxes[i].checked) {
          checkedCount++;
        }
      }

      if (checkedCount === 0) {
        this.selectAllCheckbox.indeterminate = false;
        this.selectAllCheckbox.checked = false;
      } else if (checkedCount === allCheckboxes.length) {
        this.selectAllCheckbox.indeterminate = false;
        this.selectAllCheckbox.checked = true;
      } else {
        this.selectAllCheckbox.indeterminate = true;
        this.selectAllCheckbox.checked = false;
      }
    } catch (error) {
      console.error("전체 선택 상태 업데이트 중 오류:", error);
    }
  };

  CheckboxManagerCompat.prototype.toggleAllCheckboxes = function (checked) {
    var self = this;
    this.checkboxes.forEach(function (checkbox) {
      checkbox.checked = checked;
      self.updateCheckboxItemStyle(checkbox);
    });
    this.updateSelectedItemsDisplay();
  };

  CheckboxManagerCompat.prototype.getSelectedItems = function () {
    var selectedItems = [];
    var self = this;

    this.checkboxes.forEach(function (checkbox, id) {
      if (checkbox.checked) {
        var label = self.getLabelText(checkbox);
        selectedItems.push({
          id: id,
          value: checkbox.value,
          label: label,
        });
      }
    });

    return selectedItems;
  };

  CheckboxManagerCompat.prototype.getLabelText = function (checkbox) {
    try {
      // label for 속성으로 연결된 label 찾기
      if (checkbox.id) {
        var label = document.querySelector('label[for="' + checkbox.id + '"]');
        if (label) {
          return label.textContent || label.innerText;
        }
      }

      // 부모 요소에서 label 찾기
      var parent = checkbox.parentElement;
      if (parent) {
        var label = parent.querySelector("label");
        if (label) {
          return label.textContent || label.innerText;
        }
      }

      return checkbox.value || "Unknown";
    } catch (error) {
      return checkbox.value || "Unknown";
    }
  };

  CheckboxManagerCompat.prototype.showSelectedItems = function (items) {
    try {
      if (items.length === 0) {
        this.selectedItemsContainer.innerHTML =
          "<p>선택된 항목이 없습니다.</p>";
        return;
      }

      var itemsHtml = "";
      for (var i = 0; i < items.length; i++) {
        itemsHtml += '<span class="result-item">' + items[i].label + "</span>";
      }

      this.selectedItemsContainer.innerHTML = itemsHtml;
    } catch (error) {
      console.error("선택된 항목 표시 중 오류:", error);
    }
  };

  CheckboxManagerCompat.prototype.selectRandomItems = function () {
    try {
      var allCheckboxes = WebViewCompat.arrayFrom(this.checkboxes.values());
      var randomCount = Math.floor(Math.random() * allCheckboxes.length) + 1;

      // 모든 체크박스 해제
      var self = this;
      allCheckboxes.forEach(function (checkbox) {
        checkbox.checked = false;
        self.updateCheckboxItemStyle(checkbox);
      });

      // 랜덤하게 선택
      var shuffled = this.shuffleArray(allCheckboxes);
      var selected = shuffled.slice(0, randomCount);

      for (var i = 0; i < selected.length; i++) {
        selected[i].checked = true;
        this.updateCheckboxItemStyle(selected[i]);
      }

      this.updateSelectAllState();
      this.updateSelectedItemsDisplay();
    } catch (error) {
      console.error("랜덤 선택 중 오류:", error);
    }
  };

  CheckboxManagerCompat.prototype.shuffleArray = function (array) {
    var shuffled = [];
    for (var i = 0; i < array.length; i++) {
      shuffled.push(array[i]);
    }

    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    return shuffled;
  };

  CheckboxManagerCompat.prototype.clearAllCheckboxes = function () {
    var self = this;
    this.checkboxes.forEach(function (checkbox) {
      checkbox.checked = false;
      self.updateCheckboxItemStyle(checkbox);
    });
    this.updateSelectAllState();
    this.updateSelectedItemsDisplay();
  };

  CheckboxManagerCompat.prototype.updateSelectedItemsDisplay = function () {
    var selectedItems = this.getSelectedItems();
    this.showSelectedItems(selectedItems);
  };

  return CheckboxManagerCompat;
})();

// 전역 객체에 추가 (WebView 호환성)
window.CheckboxManagerCompat = CheckboxManagerCompat;
window.WebViewCompat = WebViewCompat;

// 자동 초기화 (DOM 로딩 완료 후)
function initializeCheckboxManager() {
  try {
    if (document.readyState === "loading") {
      WebViewCompat.addEvent(document, "DOMContentLoaded", function () {
        new CheckboxManagerCompat();
      });
    } else {
      new CheckboxManagerCompat();
    }
  } catch (error) {
    console.error("체크박스 관리자 초기화 실패:", error);
  }
}

// 페이지 로드 시 초기화
if (typeof window !== "undefined") {
  initializeCheckboxManager();
}
