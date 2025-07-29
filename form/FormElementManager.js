const FormElementManager = (() => {
  "use strict";

  class FormElementManager {
    constructor(containerSelector, options = {}) {
      this.container = document.querySelector(containerSelector);
      if (!this.container) {
        throw new Error(`Container not found: ${containerSelector}`);
      }

      this.values = {};
      this.onChange = options.onChange || null;

      this.container.addEventListener("change", (e) => this._handleChange(e));
      this.container.addEventListener("input", (e) => this._handleInput(e));

      this._initializeValues();
      this._setupMasterCheckboxes();
    }

    _initializeValues() {
      const elements = this._getFormElements();
      elements.forEach((el) => {
        const key = this._getKey(el);
        if (!key) return;

        if (el.type === "checkbox" && el.name) {
          if (!this.values.hasOwnProperty(el.name)) {
            this.values[el.name] = this._getCheckboxGroupValue(el.name);
          }
        } else if (el.type === "radio" && el.name) {
          if (!this.values.hasOwnProperty(el.name)) {
            this.values[el.name] = this._getRadioGroupValue(el.name);
          }
        } else {
          this.values[key] = this._getValue(el);
        }
      });
    }

    _setupMasterCheckboxes() {
      this.container
        .querySelectorAll('input[type="checkbox"][data-master]')
        .forEach((master) => {
          const groupName = master.getAttribute("data-group");
          if (!groupName) return;

          this._syncMasterWithGroup(master, groupName);

          this.container.addEventListener("change", (e) => {
            if (e.target.name === groupName && e.target.type === "checkbox") {
              this._syncMasterWithGroup(master, groupName);
            }
          });
        });
    }

    _syncMasterWithGroup(master, groupName) {
      const checkboxes = this.container.querySelectorAll(
        `input[type="checkbox"][name="${groupName}"]`
      );
      const checked = this.container.querySelectorAll(
        `input[type="checkbox"][name="${groupName}"]:checked`
      );
      const allSelected =
        checkboxes.length > 0 && checkboxes.length === checked.length;

      master.checked = allSelected;
      master.indeterminate = false; // 사용 안 함

      this.values[groupName] = Array.from(checked).map((cb) => cb.value);
    }

    _getKey(el) {
      return el.name || el.id || null;
    }

    _getValue(el) {
      if (el.tagName === "SELECT") {
        return el.multiple
          ? Array.from(el.selectedOptions).map((o) => o.value)
          : el.value;
      }

      if (el.type === "checkbox") {
        if (!el.name) return el.checked;
        return this._getCheckboxGroupValue(el.name);
      }

      if (el.type === "radio") {
        return this._getRadioGroupValue(el.name);
      }

      return el.value;
    }

    _getCheckboxGroupValue(name) {
      return Array.from(
        this.container.querySelectorAll(
          `input[type="checkbox"][name="${name}"]:checked`
        )
      ).map((cb) => cb.value);
    }

    _getRadioGroupValue(name) {
      const checked = this.container.querySelector(
        `input[type="radio"][name="${name}"]:checked`
      );
      return checked ? checked.value : "";
    }

    _getFormElements() {
      return this.container.querySelectorAll(
        `
        input[type="text"], input[type="email"], input[type="number"],
        input[type="tel"], input[type="password"], input[type="checkbox"],
        input[type="radio"], textarea, select
      `.trim()
      );
    }

    _handleInput(e) {
      const target = e.target;
      const tag = target.tagName;
      const type = target.type;

      if (
        (tag === "INPUT" &&
          ["text", "email", "number", "tel", "password"].includes(type)) ||
        tag === "TEXTAREA"
      ) {
        this._updateValue(target);
      }
    }

    _handleChange(e) {
      const target = e.target;
      const type = target.type;

      // 전체 선택 체크박스 처리
      if (type === "checkbox" && target.dataset.master !== undefined) {
        const groupName = target.dataset.group;
        if (groupName) {
          const isChecked = target.checked;
          const checkboxes = this.container.querySelectorAll(
            `input[type="checkbox"][name="${groupName}"]`
          );

          checkboxes.forEach((cb) => {
            cb.checked = isChecked;
          });

          this.values[groupName] = isChecked
            ? Array.from(checkboxes).map((cb) => cb.value)
            : [];

          if (typeof this.onChange === "function") {
            this.onChange({
              name: groupName,
              value: this.values[groupName],
              element: target,
              timestamp: new Date(),
            });
          }

          return;
        }
      }

      // 일반 변경 처리
      if (
        type === "checkbox" ||
        type === "radio" ||
        target.tagName === "SELECT"
      ) {
        this._updateValue(target);
      }
    }

    _updateValue(el) {
      const key = this._getKey(el);
      if (!key && !(el.type === "checkbox" || el.type === "radio")) return;

      let newValue;

      if (el.type === "checkbox" && el.name) {
        newValue = this._getCheckboxGroupValue(el.name);
        this._updateGroupValues(el.name, newValue);

        const master = this.container.querySelector(
          `input[type="checkbox"][data-group="${el.name}"][data-master]`
        );
        if (master) {
          this._syncMasterWithGroup(master, el.name);
        }
      } else if (el.type === "radio" && el.name) {
        newValue = this._getRadioGroupValue(el.name);
        this._updateGroupValues(el.name, newValue);
      } else {
        newValue = this._getValue(el);
        this.values[key] = newValue;
      }

      const oldValue = this.values[key];
      if (oldValue !== newValue && typeof this.onChange === "function") {
        this.onChange({
          name: el.name || el.id,
          value: newValue,
          element: el,
          timestamp: new Date(),
        });
      }
    }

    _updateGroupValues(name, value) {
      const groupElements = this.container.querySelectorAll(`[name="${name}"]`);
      groupElements.forEach((el) => {
        const key = this._getKey(el);
        if (key && !["checkbox", "radio"].includes(el.type)) {
          this.values[key] = value;
        }
      });
      this.values[name] = value;
    }

    // --- Public Methods ---

    getValues() {
      return { ...this.values };
    }

    getValue(name) {
      return this.values[name];
    }

    setValue(name, value) {
      const elements = this._getFormElements();
      let updated = false;

      elements.forEach((el) => {
        const key = this._getKey(el);
        if (!key) return;

        if (el.type === "checkbox" && el.name === name) {
          el.checked = value.includes
            ? value.includes(el.value)
            : value === el.value;
          updated = true;
        } else if (el.type === "radio" && el.name === name) {
          el.checked = el.value === value;
          updated = true;
        } else if (key === name) {
          if (el.tagName === "SELECT" && el.multiple && Array.isArray(value)) {
            Array.from(el.options).forEach((opt) => {
              opt.selected = value.includes(opt.value);
            });
          } else {
            el.value = value;
          }
          this.values[key] = value;
          updated = true;
        }
      });

      if (updated) {
        if (this.container.querySelector(`[name="${name}"]`)) {
          if (
            this.container.querySelector(
              `input[type="checkbox"][name="${name}"]`
            )
          ) {
            this.values[name] = this._getCheckboxGroupValue(name);
            const master = this.container.querySelector(
              `input[type="checkbox"][data-group="${name}"][data-master]`
            );
            if (master) this._syncMasterWithGroup(master, name);
          } else if (
            this.container.querySelector(`input[type="radio"][name="${name}"]`)
          ) {
            this.values[name] = this._getRadioGroupValue(name);
          }
        }
      } else {
        this.values[name] = value;
      }
    }

    reset() {
      const elements = this._getFormElements();
      elements.forEach((el) => {
        const key = this._getKey(el);
        if (!key) return;

        if (el.type === "checkbox") {
          el.checked = false;
          if (el.name) {
            this.values[el.name] = [];
          } else {
            this.values[key] = false;
          }
          const master = this.container.querySelector(
            `input[type="checkbox"][data-group="${el.name}"][data-master]`
          );
          if (master) {
            master.checked = false;
            master.indeterminate = false;
          }
        } else if (el.type === "radio") {
          el.checked = false;
          if (el.name) this.values[el.name] = "";
        } else if (el.tagName === "SELECT" && el.multiple) {
          Array.from(el.options).forEach((o) => (o.selected = false));
          this.values[key] = [];
        } else {
          el.value = "";
          this.values[key] = "";
        }
      });
    }

    remove(name) {
      delete this.values[name];
    }
  }

  return FormElementManager;
})();
