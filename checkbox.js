"use strict";

// ES6 클래스를 사용한 체크박스 관리자
class CheckboxManager {
  constructor() {
    this.checkboxes = new Map();
    this.selectAllCheckbox = document.getElementById("selectAll");
    this.selectedItemsContainer = document.getElementById("selectedItems");

    this.init();
  }

  init() {
    // 모든 체크박스 요소들을 수집
    const checkboxElements = document.querySelectorAll(
      'input[type="checkbox"]:not(#selectAll)'
    );

    checkboxElements.forEach((checkbox) => {
      this.checkboxes.set(checkbox.id, checkbox);
      this.setupCheckboxEvent(checkbox);
    });

    // 전체 선택/해제 이벤트 설정
    this.selectAllCheckbox.addEventListener("change", (e) => {
      this.toggleAllCheckboxes(e.target.checked);
    });

    // 버튼 이벤트 설정
    this.setupButtonEvents();

    // 초기 상태 업데이트
    this.updateSelectAllState();
  }

  setupCheckboxEvent(checkbox) {
    checkbox.addEventListener("change", (e) => {
      this.updateCheckboxItemStyle(e.target);
      this.updateSelectAllState();
      this.updateSelectedItemsDisplay();
    });
  }

  setupButtonEvents() {
    // 선택된 항목 확인 버튼
    document.getElementById("getSelected").addEventListener("click", () => {
      const selectedItems = this.getSelectedItems();
      this.showSelectedItems(selectedItems);
    });

    // 랜덤 선택 버튼
    document.getElementById("selectRandom").addEventListener("click", () => {
      this.selectRandomItems();
    });

    // 모두 해제 버튼
    document.getElementById("clearAll").addEventListener("click", () => {
      this.clearAllCheckboxes();
    });
  }

  updateCheckboxItemStyle(checkbox) {
    const item = checkbox.closest(".checkbox-item");
    if (checkbox.checked) {
      item.classList.add("checked");
    } else {
      item.classList.remove("checked");
    }
  }

  updateSelectAllState() {
    const allCheckboxes = Array.from(this.checkboxes.values());
    const checkedCount = allCheckboxes.filter((cb) => cb.checked).length;

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
  }

  toggleAllCheckboxes(checked) {
    this.checkboxes.forEach((checkbox) => {
      checkbox.checked = checked;
      this.updateCheckboxItemStyle(checkbox);
    });
    this.updateSelectedItemsDisplay();
  }

  getSelectedItems() {
    const selectedItems = [];
    this.checkboxes.forEach((checkbox, id) => {
      if (checkbox.checked) {
        selectedItems.push({
          id: id,
          value: checkbox.value,
          label: checkbox.nextElementSibling.textContent,
        });
      }
    });
    return selectedItems;
  }

  showSelectedItems(items) {
    if (items.length === 0) {
      this.selectedItemsContainer.innerHTML = "<p>선택된 항목이 없습니다.</p>";
      return;
    }

    const itemsHtml = items
      .map((item) => `<span class="result-item">${item.label}</span>`)
      .join("");

    this.selectedItemsContainer.innerHTML = itemsHtml;
  }

  selectRandomItems() {
    const allCheckboxes = Array.from(this.checkboxes.values());
    const randomCount = Math.floor(Math.random() * allCheckboxes.length) + 1;

    // 모든 체크박스 해제
    allCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
      this.updateCheckboxItemStyle(checkbox);
    });

    // 랜덤하게 선택
    const shuffled = [...allCheckboxes].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, randomCount);

    selected.forEach((checkbox) => {
      checkbox.checked = true;
      this.updateCheckboxItemStyle(checkbox);
    });

    this.updateSelectAllState();
    this.updateSelectedItemsDisplay();
  }

  clearAllCheckboxes() {
    this.checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
      this.updateCheckboxItemStyle(checkbox);
    });
    this.updateSelectAllState();
    this.updateSelectedItemsDisplay();
  }

  updateSelectedItemsDisplay() {
    const selectedItems = this.getSelectedItems();
    this.showSelectedItems(selectedItems);
  }
}

// 체크박스 관리자 인스턴스 생성 함수
const createCheckboxManager = () => {
  return new CheckboxManager();
};

// 스토어 객체
const store = {
  name: "John",
  createManager: createCheckboxManager,
};

// ES6 모듈 export

const add = (a, b) => {
  return a + b;
};

const subtract = (a, b) => {
  return a - b;
};

export { add, subtract };

export default store;
