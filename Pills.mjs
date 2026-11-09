import BaseComponent from "./BaseComponent.mjs";
import BasicUtilities from "./BasicUtilities.mjs";
import DateHelper from "./DateHelper.mjs";
import { Logger, LogLevel } from "./Logger.mjs";

export class Pill extends BaseComponent {
  /* @type {number} */
  #index = 0;
  /* @type {PillContainer} */
  #container = new PillContainer(this.closest("hm-pill-container") ?? document.createElement("hm-pill-container"));
  /* @type {HTMLSpanElement} */
  #valueSpan = this.querySelector(`.pill-${this.#index ?? 0}`) ?? document.createElement("span");
  /* @type {HTMLSpanElement} */
  #span = this.querySelector(".pill") ?? document.createElement("span");
  /* @type {HTMLButtonElement} */
  #deleteButton = this.querySelector(".delete-pill") ?? document.createElement("button");
  /* @type {(isRerenderOrEvent: boolean | Event) => void} */
  #boundDelete = this.delete.bind(this);
  /* @type {string} */
  #value =  "";
   /* @type {HTMLSpanElement} */
  #wrapper = this.closest("hm-pill-wrapper") ?? document.createElement("hm-pill-wrapper");
  constructor() {
    super("hm-pill", LogLevel.Trace);
    this.#container ??= new PillContainer(this.closest("hm-pill-container") ?? document.createElement("hm-pill-container"));
  }
  /**
   * Gets or sets the container of this pill.
   * @returns {PillContainer} The container of this pill.
   */
  get container() {
    return this.#container ?? new PillContainer(this.closest("hm-pill-container") ?? document.createElement("hm-pill-container"));
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
    return this.#index ?? 0;
  }
  /**
   * Gets or sets the index of this pill.
   * @param {number} value The index of this pill.
   */
  set index(value) {
    if (this.#index !== value && typeof value === "number" && value >= 0) {
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
    const existingValueSpan = this.#wrapper.querySelector(`.pill-${this.#index}`);
    if (existingValueSpan?.textContent === this.#value) {
      Logger.warn(`render() called on existing Pill`);
      return;
    }
    /* @type {HTMLSpanElement} */
    this.#span = document.createElement("span");
    this.#span.classList.add("pill");
    /* @type {HTMLSpanElement} */
    this.#valueSpan = document.createElement("span");
    this.#valueSpan.classList.add(`pill-${this.#index}`);
    this.#valueSpan.textContent = this.#value;
    /* @type {HTMLButtonElement} */
    this.#deleteButton = document.createElement("button") /* as HTMLButtonElement */;
    this.#deleteButton.classList.add("delete-pill");
    if ("dataset" in this.#deleteButton) {
      this.#deleteButton.dataset.pill = this.#value;
    } else {
      this.#deleteButton.setAttribute("data-pill", this.#value);
    }
    this.#boundDelete = this.delete.bind(this);

    this.#deleteButton.addEventListener("click", this.#boundDelete);
    this.#span.appendChild(this.#valueSpan);
    this.#span.appendChild(this.#deleteButton);
    this.#wrapper.appendChild(this.#span);
  }
  /**
   *
   * @param {Event|boolean} isRerenderOrEvent true to rerender the pill, false if delete() was called by an internal event
   */
  delete(isRerenderOrEvent = false) {
    const isRerender = typeof isRerenderOrEvent === "boolean" ? isRerenderOrEvent : false;
    if (this.#deleteButton && typeof this.#boundDelete === "function") {
      this.#deleteButton.removeEventListener("click", this.#boundDelete);
      this.#deleteButton.remove();
    } else {
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
  #id = "";
  #instanceId = 0;
  #labelElement = new HTMLLabelElement();
  #labelText = "";
  #inputElement = new HTMLInputElement();
  #hasSelect = false;
  #selectElement = new HTMLSelectElement();
  #selectSource = "";
  #boundParse = this.parsePills.bind(this);
  #boundSelect = this.selectPill.bind(this);
  #wrapper = new HTMLSpanElement();
  // @type {Pill[]}
  #pills = [] /* as Pill[] */;
  #value = "";
  static delimiter = " ";
  /**
   * 
   * @param {HTMLElement} element 
   * @param {LogLevel} logLevel 
   */
  constructor(element, logLevel = LogLevel.Trace) {
    super("hm-pill-container", logLevel);
    const me = this;
    this.doOrDoNot(function () {
      me.#instanceId = performance?.now() ?? Date.now();
      me.#instanceId = +(me.#instanceId.toString().replaceAll(/\D/g, ""));
      if (+(me.logLevel) <= LogLevel.Log) {
        console.time(`constructor for instance ${me.#instanceId}`);
      }

      me.attachShadow({ mode: "open" });

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
      me.shadowRoot?.host.appendChild(cssLink);

      if (+(me.logLevel) <= LogLevel.Log) {
        console.timeEnd(`constructor for instance ${me.#instanceId}`);
      }
    });
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
    return this.#id ?? 
      (this.#id = (this.shadowRoot?.host ?? this.#wrapper).id);
  }
  /**
   * Gets or sets the ID of the PillContainer.
   * @param {string} value The ID of the PillContainer.
   */
  set id(value) {
    if (this.#id !== value) {
      this.#id = value;
      if (this.shadowRoot?.host) {
        this.shadowRoot.host.id = value;
      }
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
    if (this.#value !== value || (this.#inputElement && this.#inputElement.value !== value)) {
      const changeEvent = new Event("change");
      if (this.dispatchEventAndReport("change", changeEvent, value)) {
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
  me = this;
  static get attributeToPropertyMap() {
    return new Map([
      [
        "value",
        {
          /**
           * Gets the value of the PillContainer.
           * @returns {string} The value of the PillContainer.
           */
          getter: function () {
            return me.value;
          },
          /**
           * Sets the value of the PillContainer.
           * @param {string} value The value to set.
           */
          setter: function (value) {
            me.value = value;
          },
        },
      ],
      [
        "data-pills-label",
        {
          /**
           * Gets the text of the label.
           * @returns {string} The text of the label
           */
          getter: function () {
            return me.#labelText;
          },
          /**
           * Sets the text of the label.
           * @param {string} value The text of the label.
           */
          setter: function (value) {
            me.#labelText = value ?? me.#labelText;
          },
        },
      ],
      [
        "data-label",
        {
          getter: function () {
            return me.#labelText;
          },
          setter: function (value) {
            me.#labelText = value ?? me.#labelText;
          },
        },
      ],
      [
        "pills-label",
        {
          getter: function () {
            return me.#labelText;
          },
          setter: function (value) {
            me.#labelText = value ?? me.#labelText;
          },
        },
      ],
      [
        "pillsLabel",
        {
          getter: function () {
            return me.#labelText;
          },
          setter: function (value) {
            me.#labelText = value ?? me.#labelText;
          },
        },
      ],
      [
        "label",
        {
          getter: function () {
            return me.#labelText;
          },
          setter: function (value) {
            me.#labelText = value ?? me.#labelText;
          },
        },
      ],
      [
        "data-pills-select",
        {
          getter: function () {
            return me.#hasSelect;
          },
          setter: function (value) {
            me.#hasSelect = value ? BasicUtilities.parseBoolean(value) : me.#hasSelect;
          },
        },
      ],
      [
        "data-select",
        {
          getter: function () {
            return me.#hasSelect;
          },
          setter: function (value) {
            me.#hasSelect = value ? BasicUtilities.parseBoolean(value) : me.#hasSelect;
          },
        },
      ],
      [
        "pills-select",
        {
          getter: function () {
            return me.#hasSelect;
          },
          setter: function (value) {
            me.#hasSelect = value ? BasicUtilities.parseBoolean(value) : me.#hasSelect;
          },
        },
      ],
      [
        "pillsSelect",
        {
          getter: function () {
            return me.#hasSelect;
          },
          setter: function (value) {
            me.#hasSelect = value ? BasicUtilities.parseBoolean(value) : me.#hasSelect;
          },
        },
      ],
      [
        "select",
        {
          getter: function () {
            return me.#hasSelect;
          },
          setter: function (value) {
            me.#hasSelect = value ? BasicUtilities.parseBoolean(value) : me.#hasSelect;
          },
        },
      ],
      [
        "data-pills-select-source",
        {
          getter: function () {
            return me.#selectSource;
          },
          setter: function (value) {
            me.#selectSource = value ?? me.#selectSource;
          },
        },
      ],
      [
        "data-select-source",
        {
          getter: function () {
            return me.#selectSource;
          },
          setter: function (value) {
            me.#selectSource = value ?? me.#selectSource;
          },
        },
      ],
      [
        "pills-select-source",
        {
          getter: function () {
            return me.#selectSource;
          },
          setter: function (value) {
            me.#selectSource = value ?? me.#selectSource;
          },
        },
      ],
      [
        "pillsSelectSource",
        {
          getter: function () {
            return me.#selectSource;
          },
          setter: function (value) {
            me.#selectSource = value ?? me.#selectSource;
          },
        },
      ],
      [
        "selectSource",
        {
          getter: function () {
            return me.#selectSource;
          },
          setter: function (value) {
            me.#selectSource = value ?? me.#selectSource;
          },  
        },
      ],
    ]);
  }
  /**
   * Invoked when one of the PillContainer's attributes is added, removed, or changed.
   * @param {string} name The name of the attribute that changed.
   * @param {string} oldValue The previous value of the attribute.
   * @param {string} newValue The new value of the attribute.
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (+(this.logLevel) <= LogLevel.Log) {
      console.log("attributeChangedCallback", name, oldValue, newValue);
    }
    const property = PillContainer.attributeToPropertyMap.get(name);
    if (property?.setter) {
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
  /**
   * 
   * @param {Event | boolean} isRerenderOrEvent Is this function being called as part of a
   * rerendering of the component or a triggering of an event?
   * @returns If the function is being called as part of a rerendering of the component, a
   * boolean indication that; otherwise the Event object which called the function.
   */
  parsePills(isRerenderOrEvent = false) {
    if (
      isRerenderOrEvent instanceof Event &&
      !this.dispatchEventAndReport("input", isRerenderOrEvent, this.#inputElement?.value)
    ) {
      return;
    }
    const value = this.value;
    const pillValues = value.split(PillContainer.delimiter).filter((v) => !!v && v.length > 0);
    const previousValue = (this.#pills ?? []).map((p) => p.value).join(PillContainer.delimiter);
    const newChars = value.replace(previousValue, "");
    if (newChars.length === 1 && newChars === PillContainer.delimiter) {
      // If the user typed a delimiter, ignore it
      return;
    }
    const isRerender = typeof isRerenderOrEvent === "boolean" ? isRerenderOrEvent : false;
    Logger.trace(`${this.prefix} | parsePills(isRerender:${isRerender})`);
    Logger.trace(
      `${this.prefix} | parsePills(isRerender:${isRerender}) | pillValues: ${pillValues.join(PillContainer.delimiter)}`,
    );
    if (this.#pills?.length) {
      this.#pills.forEach((pill) => pill.delete(true));
    }
    this.#pills = pillValues.map((pillValue, idx) => {
      /* @type {Pill} */
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
    if (typeof this.#boundParse === "function") {
      return this.#boundParse;
    }
    this.#boundParse = this.parsePills.bind(this);
    return this.#boundParse;
  }
  selectPill() {
    const newValue = this.#selectElement.value;
    this.value += `${PillContainer.delimiter}${newValue}${PillContainer.delimiter}`;
    this.parsePills();
  }
  get boundSelect() {
    if (typeof this.#boundSelect === "function") {
      return this.#boundSelect;
    }
    this.#boundSelect = this.selectPill.bind(this);
    return this.#boundSelect;
  }
  /**
   * Deletes a pill from the PillContainer.
   * @param {Pill} pill The pill to delete
   */
  deletePill(pill) {
    const index = this.#pills.findIndex((pil) => pill.value === pil.value);
    this.#pills.splice(index, 1);
    this.renderPills(false);
  }
  /**
   * Retrieves a pill from the PillContainer by its value.
   * @param {string} value The value of the pill to retrieve
   * @returns {Pill | undefined} The pill if found, otherwise undefined
   */
  getPillByValue(value) {
    return this.#pills.find((p) => p.value === value);
  }
  updateSelectSource() {
    if (
      this.#selectSource &&
      typeof this.#selectSource === "string" &&
      this.#selectSource.startsWith("[")
    ) {
      const me = this;
      this.doOrDoNot(function () {
        const selectData = JSON.parse(me.#selectSource);
        if (Array.isArray(selectData) && typeof selectData[0] === "object") {
          if ("text" in selectData[0] && "value" in selectData[0]) {
            selectData.forEach((datum) => {
              const option = document.createElement("option");
              option.text = datum.text;
              option.value = datum.value;
              if ("selected" in datum) {
                option.selected = datum.selected;
              }
              me.#selectElement.appendChild(option);
            });
          } else if ("label" in selectData[0] && "value" in selectData[0]) {
            selectData.forEach((datum) => {
              const option = document.createElement("option");
              option.text = datum.label;
              option.value = datum.value;
              if ("selected" in datum) {
                option.selected = datum.selected;
              }
              me.#selectElement.appendChild(option);
            });
          }
        } else if (Array.isArray(selectData) && typeof selectData[0] === "string") {
          selectData.forEach((datum) => {
            const option = document.createElement("option");
            option.text = option.value = datum;
            if ("selected" in datum) {
              option.selected = datum.selected;
            }
            me.#selectElement.appendChild(option);
          });
        }
      }, this);
    } else if (
      this.#selectSource &&
      typeof this.#selectSource === "string" &&
      this.#selectSource.startsWith("DateHelper.")
    ) {
      const me = this;
      this.doOrDoNot(function () {
        const source = me.#selectSource.replace("DateHelper.", "");
        let selectData = [];
        if (source.endsWith("()")) {
          selectData =
            DateHelper[me.#selectSource.replace("DateHelper.", "").replace("()", "")]();
        } else {
          selectData = DateHelper[me.#selectSource.replace("DateHelper.", "")];
        }
        selectData.forEach((datum) => {
          const option = document.createElement("option");
          option.text = option.value = datum;
          me.#selectElement.appendChild(option);
        });
      }, this);
    }
  }
  renderPills(doParse = true) {
    const me = this;
    this.doOrDoNot(function () {
      if (!me.#wrapper) {
        me.#wrapper = document.createElement("span");
        me.#wrapper.classList.add("pill-wrapper");
        me.#labelElement = document.createElement("label");
        me.#labelElement.id = `label-pills-${me.#instanceId}`;
        me.#labelElement.htmlFor = `input-pills-${me.#instanceId}`;
        me.#labelElement.innerHTML = me.#labelText;
        me.#wrapper.appendChild(me.#labelElement);
        me.#inputElement = document.createElement("input");
        me.#inputElement.id = `input-pills-${me.#instanceId}`;
        me.#inputElement.name = `input-pills-${me.#instanceId}`;
        me.#inputElement.type = "text";
        me.#inputElement.classList.add("pills");
        if (me.value) {
          me.#inputElement.value = me.value;
        }
        me.#inputElement.addEventListener("input", me.boundParse);
        me.#wrapper.appendChild(me.#inputElement);
        if (me.#hasSelect) {
          me.#selectElement = document.createElement("select");
          me.#selectElement.id = `select-pills-${me.#instanceId}`;
          me.#selectElement.classList.add("pills-select");
          me.#selectElement.setAttribute("aria-labelledby", me.#labelElement.id);
          const defaultOption = document.createElement("option");
          defaultOption.disabled = true;
          defaultOption.selected = true;
          me.#selectElement.appendChild(defaultOption);
          me.updateSelectSource();
          me.#selectElement.addEventListener("change", me.boundSelect);
          me.#wrapper.appendChild(me.#selectElement);
        }
        me.shadowRoot.appendChild(me.#wrapper);
      }
      if (doParse) {
        me.parsePills(true);
      }
      if (me.#pills?.length) {
        me.#pills.forEach(/** @param {Pill} pill The pill to render */ (pill) => pill.render(me.#wrapper));
        me.value = me.#pills.map(/** @param {Pill} p The pill to get the value of */ (p) => p.value).join(PillContainer.delimiter);
      }
    }, this);
  }
  updateProperties() {
    const me = this;
    this.doOrDoNot(function () {
      const ds = me.shadowRoot.host.dataset;
      const { pillsSelect, select, pillsLabel, label, pillsSelectSource, selectSource } = ds;
      me.attributeChangedCallback("data-pills-select", me.#hasSelect, pillsSelect);
      me.attributeChangedCallback("data-select", me.#hasSelect, select);
      me.attributeChangedCallback("data-pills-label", me.#labelText, pillsLabel);
      me.attributeChangedCallback("data-label", me.#labelText, label);
      me.attributeChangedCallback(
        "data-pills-select-source",
        me.#selectSource,
        pillsSelectSource,
      );
      me.attributeChangedCallback("data-select-source", me.#selectSource, selectSource);
      PillContainer.observedAttributes
        .filter((attr) => !attr.startsWith("data-"))
        .forEach((attr) => {
          const value = me.shadowRoot.host.getAttribute(attr);
          if (value && value.length) {
            me.attributeChangedCallback(attr, undefined, value);
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
    this.#inputElement && this.#inputElement.removeEventListener("input", this.boundParse);
    if (this.#hasSelect && this.#selectElement) {
      this.#selectElement.removeEventListener("change", this.boundSelect);
    }
  }
}
customElements.define("hm-pill-container", PillContainer);
