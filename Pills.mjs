import BaseComponent from "./BaseComponent.mjs";
import BasicUtilities from "./BasicUtilities.mjs";
import DateHelper from "./DateHelper.mjs";
import { Logger, LogLevel } from "./Logger.mjs";

export class Pill extends BaseComponent {
  #container = undefined;
  #valueSpan = undefined;
  #span = undefined;
  #deleteButton = undefined;
  #boundDelete = undefined;
  #value = undefined;
  #wrapper = undefined;
  #index = undefined;
  constructor() {
    super("hm-pill", LogLevel.Trace);
  }
  /**
   * Gets or sets the container of this pill.
   * @returns {PillContainer} The container of this pill.
   */
  get container() {
    return this.#container;
  }
  /**
   * Gets or sets the container of this pill.
   * @param {PillContainer} value The container of this pill.
   */
  set container(value) {
    if (this.#container !== value) {
      this.#container = value;
    }
  }
  /**
   * Gets or sets the index of this pill.
   * @returns {number} The index of this pill.
   */
  get index() {
    return this.#index;
  }
  /**
   * Gets or sets the index of this pill.
   * @param {number} value The index of this pill.
   */
  set index(value) {
    if (this.#index !== value) {
      this.#index = value;
    }
  }
  /**
   * Gets or sets the value of this pill.
   * @returns {string} The value of this pill.
   */
  get value() {
    return this.#value;
  }
  /**
   * Gets or sets the value of this pill.
   * @param {string} value The value of this pill.
   */
  set value(value) {
    if (this.#value !== value) {
      this.#value = value;
    }
  }
  /**
   * Renders the pill inside the given wrapper element.
   * @param {HTMLElement} wrapper The wrapper element to render the pill into.
   */
  render(wrapper) {
    this.#wrapper = wrapper;
    const existingValueSpan = this.#wrapper.querySelector(
      `.pill-${this.#index}`
    );
    if (existingValueSpan && existingValueSpan.textContent === this.#value) {
      Logger.warn(`render() called on existing Pill`);
      return;
    }
    this.#span = document.createElement("span");
    this.#span.classList.add("pill");
    this.#valueSpan = document.createElement("span");
    this.#valueSpan.classList.add(`pill-${this.#index}`);
    this.#valueSpan.textContent = this.#value;
    this.#deleteButton = document.createElement("button");
    this.#deleteButton.classList.add("delete-pill");
    this.#deleteButton.dataset.pill = this.#value;
    this.#boundDelete = this.delete.bind(this);
    this.#deleteButton.addEventListener("click", this.#boundDelete);
    this.#span.appendChild(this.#valueSpan);
    this.#span.appendChild(this.#deleteButton);
    this.#wrapper.appendChild(this.#span);
  }
  /**
   * 
   * @param {boolean} isRerenderOrEvent true to rerender the pill, false if delete() was called by an internal event
   */
  delete(isRerenderOrEvent = false) {
    const isRerender =
      typeof isRerenderOrEvent === "boolean" ? isRerenderOrEvent : false;
    if (this.#deleteButton && this.#boundDelete) {
      this.#deleteButton.removeEventListener("click", this.#boundDelete);
      this.#deleteButton.remove();
    }

    if (this.#valueSpan) {
      this.#valueSpan.remove();
    }

    if (this.#span) {
      this.#span.remove();
    }

    if (!isRerender) {
      this.#container.deletePill(this);
    }
  }
}
/**
 * Define the custom element for Pill
 */
customElements.define("hm-pill", Pill);


/**
 * Define the custom element for PillContainer
 */
export class PillContainer extends BaseComponent {
  #id = undefined;
  #instanceId = 0;
  #labelElement = this.#labelElement ?? document.createElement("label");
  #labelText = '';
  #inputElement = undefined ?? document.createElement("input");
  #hasSelect = false;
  #selectElement = this.#selectElement ?? document.createElement("span");
  #selectSource = '';
  #boundParse = this.parsePills.bind(this);
  #boundSelect = this.selectPill.bind(this);
  #wrapper = this.#wrapper ?? document.createElement("span");
  #pills = undefined;
  #value = undefined;
  static delimiter = " ";
  constructor(logLevel = LogLevel.Trace) {
    super("hm-pill-container", logLevel);
    this.doOrDoNot(function () {
      this.#instanceId = performance?.now ? 
        performance.now() : 
        Date.now();
      this.#instanceId = this.#instanceId.toString().replaceAll(/\D/g, "");
      this.logLevel <= LogLevel.Log &&
        console.time(`constructor for instance ${this.#instanceId}`);

      this.attachShadow({ mode: "open" });

      const cssLink = document.createElement("style");
      cssLink.setAttribute("type", "text/css");
      cssLink.textContent = `
      .pill-wrapper {
        display: inline-flex;
        position: relative;
        min-height: 1.5rem;
        align-items: baseline;
        margin-bottom: 0.5rem;
      }

      .pill-wrapper label {
        margin-right: 1rem;
      }

      .pill-wrapper .pills-select {
        /* min-height: 2.45rem; */
        min-height: 1.3rem;
      }

      .pills {
        /*
        min-height: 1.2rem;
        padding: 0.5rem;
        */
      }

      .pill {
        z-index: 1;
        border: 1px solid black;
        border-radius: 0.75rem;
        padding: 0.25rem 0.5rem 0.25rem 0.25rem;
        font-size: 1rem;
        background-color: lightcyan;
        display: inline-flex;
        align-items: center;
        margin: 0.25rem 0.5rem 0.25rem 0.25rem;
        min-height: 1.2rem;
      }

      .delete-pill {
        border-radius: 50%;
        height: 1.2rem;
        margin-left: 0.25rem;
        width: 1.2rem;
        position: relative;
        background: transparent;
      }

      .delete-pill::before {
        content: "🗙";
        font-size: 0.8rem;
        position: absolute;
        top: 39%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: black;
      }
      `;
      this.shadowRoot.appendChild(cssLink);

      this.logLevel <= LogLevel.Log &&
        console.timeEnd(`constructor for instance ${this.#instanceId}`);
    }, this);
  }
  /**
   * Invoked when the PillContainer is first connected to the document's DOM.
   */
  connectedCallback() {
    if (this.isConnected) {
      this.init();
    }
  }
  /**
   * Invoked when the PillContainer is disconnected from the document's DOM.
   */
  disconnectedCallback() {
    this.destroy();
  }
  /**
   * Invoked when the PillContainer is moved to a new document.
   */
  adoptedCallback() {
    // Currently no-op
  }
  /**
   * Gets or sets the ID of the PillContainer.
   * @returns {string} The ID of the PillContainer.
   */
  get id() {
    return this.#id ?? (this.#id = this.shadowRoot.id);
  }
  /**
   * Gets or sets the ID of the PillContainer.
   * @param {string} value The ID of the PillContainer.
   */
  set id(value) {
    if (this.#id !== value) {
      this.#id = value;
      this.shadowRoot.id = value;
    }
  }
  /**
   * Gets or sets the value of the PillContainer.
   * @returns {string} The value of the PillContainer.
   */
  get value() {
    this.#value = this.#inputElement?.value ?? this.#value;
    return this.#value;
  }
  /**
   * Gets or sets the value of the PillContainer.
   * @param {string} value The value of the PillContainer.
   */
  set value(value) {
    if (
      this.#value !== value ||
      (this.#inputElement && this.#inputElement.value !== value)
    ) {
      if (this.dispatchEventAndReport("change", null, value)) {
        this.#value = value;
        if (this.#inputElement) {
          this.#inputElement.value = value;
        }
        this.renderPills();
      }
    }
  }
  /**
   * Gets a map of attributes to properties for the PillContainer.
   * @returns {Map<string, {getter: Function, setter: Function}>} The map of attributes to properties.
   */
  static get attributeToPropertyMap() {
    return new Map([
      [
        "value",
        {
          getter: function () {
            return this.value;
          },
          setter: function (value) {
            this.value = value;
          },
        },
      ],
      [
        "data-pills-label",
        {
          getter: function () {
            return this.#labelText;
          },
          setter: function (value) {
            this.#labelText = value ?? this.#labelText;
          },
        },
      ],
      [
        "data-label",
        {
          getter: function () {
            return this.#labelText;
          },
          setter: function (value) {
            this.#labelText = value ?? this.#labelText;
          },
        },
      ],
      [
        "pills-label",
        {
          getter: function () {
            return this.#labelText;
          },
          setter: function (value) {
            this.#labelText = value ?? this.#labelText;
          },
        },
      ],
      [
        "pillsLabel",
        {
          getter: function () {
            return this.#labelText;
          },
          setter: function (value) {
            this.#labelText = value ?? this.#labelText;
          },
        },
      ],
      [
        "label",
        {
          getter: function () {
            return this.#labelText;
          },
          setter: function (value) {
            this.#labelText = value ?? this.#labelText;
          },
        },
      ],
      [
        "data-pills-select",
        {
          getter: function () {
            return this.#hasSelect;
          },
          setter: function (value) {
            this.#hasSelect = value
              ? BasicUtilities.parseBoolean(value)
              : this.#hasSelect;
          },
        },
      ],
      [
        "data-select",
        {
          getter: function () {
            return this.#hasSelect;
          },
          setter: function (value) {
            this.#hasSelect = value
              ? BasicUtilities.parseBoolean(value)
              : this.#hasSelect;
          },
        },
      ],
      [
        "pills-select",
        {
          getter: function () {
            return this.#hasSelect;
          },
          setter: function (value) {
            this.#hasSelect = value
              ? BasicUtilities.parseBoolean(value)
              : this.#hasSelect;
          },
        },
      ],
      [
        "pillsSelect",
        {
          getter: function () {
            return this.#hasSelect;
          },
          setter: function (value) {
            this.#hasSelect = value
              ? BasicUtilities.parseBoolean(value)
              : this.#hasSelect;
          },
        },
      ],
      [
        "select",
        {
          getter: function () {
            return this.#hasSelect;
          },
          setter: function (value) {
            this.#hasSelect = value
              ? BasicUtilities.parseBoolean(value)
              : this.#hasSelect;
          },
        },
      ],
      [
        "data-pills-select-source",
        {
          getter: function () {
            return this.#selectSource;
          },
          setter: function (value) {
            this.#selectSource = value ?? this.#selectSource;
          },
        },
      ],
      [
        "data-select-source",
        {
          getter: function () {
            return this.#selectSource;
          },
          setter: function (value) {
            this.#selectSource = value ?? this.#selectSource;
          },
        },
      ],
      [
        "pills-select-source",
        {
          getter: function () {
            return this.#selectSource;
          },
          setter: function (value) {
            this.#selectSource = value ?? this.#selectSource;
          },
        },
      ],
      [
        "pillsSelectSource",
        {
          getter: function () {
            return this.#selectSource;
          },
          setter: function (value) {
            this.#selectSource = value ?? this.#selectSource;
          },
        },
      ],
      [
        "selectSource",
        {
          getter: function () {
            return this.#selectSource;
          },
          setter: function (value) {
            this.#selectSource = value ?? this.#selectSource;
          },
        },
      ],
    ]);
  }
  /**
   * Invoked when one of the PillContainer's attributes is added, removed, or changed.
   */
  attributeChangedCallback(name, oldValue, newValue) {
    this.logLevel <= LogLevel.Log &&
      console.log("attributeChangedCallback", name, oldValue, newValue);
    const property = PillContainer.attributeToPropertyMap.get(name);
    if (property && property.setter) {
      property.setter.call(this, newValue);
    }
  }
  /**
   * Gets an array of attributes that should cause attributeChangedCallback to be called during the
   * lifetime of the PillContainer.
   */
  static get observedAttributes() {
    return [
      "value",
      "data-pills-label",
      "data-label",
      "pills-label",
      "pillsLabel",
      "label",
      "data-pills-select",
      "data-select",
      "pills-select",
      "pillsSelect",
      "select",
      "data-pills-select-source",
      "data-select-source",
      "pills-select-source",
      "pillsSelectSource",
      "selectSource",
    ];
  }
  parsePills(isRerenderOrEvent = false) {
    if (isRerenderOrEvent instanceof Event && !this.dispatchEventAndReport('input', isRerenderOrEvent, this.#inputElement?.value)) {
      return;
    }
    const value = this.value;
    const pillValues = value
      .split(PillContainer.delimiter)
      .filter((v) => !!v && v.length > 0);
    const previousValue = (this.#pills ?? [])
      .map((p) => p.value)
      .join(PillContainer.delimiter);
    const newChars = value.replace(previousValue, "");
    if (newChars.length === 1 && newChars === PillContainer.delimiter) {
      // If the user typed a delimiter, ignore it
      return;
    }
    const isRerender =
      typeof isRerenderOrEvent === "boolean" ? isRerenderOrEvent : false;
    Logger.trace(`${this.prefix} | parsePills(isRerender:${isRerender})`);
    Logger.trace(
      `${this.prefix} | parsePills(isRerender:${isRerender}) | pillValues: ${pillValues}`
    );
    if (this.#pills && this.#pills.length) {
      this.#pills.forEach((pill) => pill.delete(true));
    }
    this.#pills = pillValues.map((pillValue, idx) => {
      const pill = document.createElement("hm-pill", { is: "hm-pill" });
      pill.value = pillValue;
      pill.container = this;
      pill.index = idx;
      return pill;
    });
    if (!isRerender) {
      this.renderPills();
    }
  }
  get boundParse() {
    if (this.#boundParse) {
      return this.#boundParse;
    }
    this.#boundParse = this.parsePills.bind(this);
    return this.#boundParse;
  }
  selectPill() {
    const newValue = this.#selectElement.value;
    this.value += `${PillContainer.delimiter}${newValue}${PillContainer.delimiter
      }`;
    this.parsePills();
  }
  get boundSelect() {
    if (this.#boundSelect) {
      return this.#boundSelect;
    }
    this.#boundSelect = this.selectPill.bind(this);
    return this.#boundSelect;
  }
  deletePill(pill) {
    const index = this.#pills.findIndex((pil) => pill.value === pil.value);
    this.#pills.splice(index, 1);
    this.renderPills(false);
  }
  getPillByValue(value) {
    return this.#pills.find((p) => p.value === value);
  }
  updateSelectSource() {
    if (
      this.#selectSource &&
      typeof this.#selectSource === "string" &&
      this.#selectSource.startsWith("[")
    ) {
      this.doOrDoNot(function () {
        const selectData = JSON.parse(this.#selectSource);
        if (Array.isArray(selectData) && typeof selectData[0] === "object") {
          if ("text" in selectData[0] && "value" in selectData[0]) {
            selectData.forEach((datum) => {
              const option = document.createElement("option");
              option.text = datum.text;
              option.value = datum.value;
              if ("selected" in datum) {
                option.selected = datum.selected;
              }
              this.#selectElement.appendChild(option);
            });
          } else if ("label" in selectData[0] && "value" in selectData[0]) {
            selectData.forEach((datum) => {
              const option = document.createElement("option");
              option.text = datum.label;
              option.value = datum.value;
              if ("selected" in datum) {
                option.selected = datum.selected;
              }
              this.#selectElement.appendChild(option);
            });
          }
        } else if (
          Array.isArray(selectData) &&
          typeof selectData[0] === "string"
        ) {
          selectData.forEach((datum) => {
            const option = document.createElement("option");
            option.text = option.value = datum;
            this.#selectElement.appendChild(option);
          });
        }
      }, this);
    } else if (
      this.#selectSource &&
      typeof this.#selectSource === "string" &&
      this.#selectSource.startsWith("DateHelper.")
    ) {
      this.doOrDoNot(function () {
        const source = this.#selectSource.replace("DateHelper.", "");
        let selectData = [];
        if (source.endsWith("()")) {
          selectData =
            DateHelper[
              this.#selectSource.replace("DateHelper.", "").replace("()", "")
            ]();
        } else {
          selectData =
            DateHelper[this.#selectSource.replace("DateHelper.", "")];
        }
        selectData.forEach((datum) => {
          const option = document.createElement("option");
          option.text = option.value = datum;
          this.#selectElement.appendChild(option);
        });
      }, this);
    }
  }
  renderPills(doParse = true) {
    this.doOrDoNot(function () {
      if (!this.#wrapper) {
        this.#wrapper = document.createElement("span");
        this.#wrapper.classList.add("pill-wrapper");
        this.#labelElement = document.createElement("label");
        this.#labelElement.id = `label-pills-${this.#instanceId}`;
        this.#labelElement.htmlFor = `input-pills-${this.#instanceId}`;
        this.#labelElement.innerHTML = this.#labelText;
        this.#wrapper.appendChild(this.#labelElement);
        this.#inputElement = document.createElement("input");
        this.#inputElement.id = `input-pills-${this.#instanceId}`;
        this.#inputElement.type = "text";
        this.#inputElement.classList.add("pills");
        if (this.value) {
          this.#inputElement.value = this.value;
        }
        this.#inputElement.addEventListener("input", this.boundParse);
        this.#wrapper.appendChild(this.#inputElement);
        if (this.#hasSelect) {
          this.#selectElement = document.createElement("select");
          this.#selectElement.id = `select-pills-${this.#instanceId}`;
          this.#selectElement.classList.add("pills-select");
          this.#selectElement.setAttribute(
            "aria-labelledby",
            this.#labelElement.id
          );
          const defaultOption = document.createElement("option");
          defaultOption.disabled = true;
          defaultOption.selected = true;
          this.#selectElement.appendChild(defaultOption);
          this.updateSelectSource();
          this.#selectElement.addEventListener("change", this.boundSelect);
          this.#wrapper.appendChild(this.#selectElement);
        }
        this.shadowRoot.appendChild(this.#wrapper);
      }
      if (doParse) {
        this.parsePills(true);
      }
      this.#pills.forEach((pill) => pill.render(this.#wrapper));
      this.value = this.#pills
        .map((p) => p.value)
        .join(PillContainer.delimiter);
    }, this);
  }
  updateProperties() {
    this.doOrDoNot(function () {
      const ds = this.shadowRoot.host.dataset;
      const {
        pillsSelect,
        select,
        pillsLabel,
        label,
        pillsSelectSource,
        selectSource,
      } = ds;
      this.attributeChangedCallback(
        "data-pills-select",
        this.#hasSelect,
        pillsSelect
      );
      this.attributeChangedCallback("data-select", this.#hasSelect, select);
      this.attributeChangedCallback(
        "data-pills-label",
        this.#labelText,
        pillsLabel
      );
      this.attributeChangedCallback("data-label", this.#labelText, label);
      this.attributeChangedCallback(
        "data-pills-select-source",
        this.#selectSource,
        pillsSelectSource
      );
      this.attributeChangedCallback(
        "data-select-source",
        this.#selectSource,
        selectSource
      );
      PillContainer.observedAttributes
        .filter((attr) => !attr.startsWith("data-"))
        .forEach((attr) => {
          const value = this.shadowRoot.host.getAttribute(attr);
          if (value && value.length) {
            this.attributeChangedCallback(attr, undefined, value);
          }
        });
    }, this);
  }
  init() {
    this.updateProperties();
    this.renderPills();
  }
  destroy() {
    this.#pills.forEach((pill) => pill.delete());
    this.#inputElement &&
      this.#inputElement.removeEventListener("input", this.boundParse);
    if (this.#hasSelect && this.#selectElement) {
      this.#selectElement.removeEventListener("change", this.boundSelect);
    }
  }
}
customElements.define("hm-pill-container", PillContainer);
