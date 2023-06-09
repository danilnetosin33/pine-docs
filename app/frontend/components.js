Ractive.components["form-builder"] = Ractive.extend({
  template: `
          <form>
              {{#each config as input}}
                  <div class="mb-3">
                      {{#if input.type == "range"}}
                      <range-input config={{input}}  />
                      {{elseif input.type == "multifield"}}
                        <multifield config="{{input}}"/>
                      {{elseif input.type == "text"}}
                        <text-input config={{input}}/>
                      {{elseif input.type == "divider"}}
                        <divider config={{input}} />
                      {{elseif input.type == "select"}}
                        <select-input config={{input}} />
                      {{elseif input.type == "dropdown"}}
                        <dropdown-input config={{input}} />
                      {{elseif input.type == "date"}}
                        <date-input config={{input}} />
                      {{elseif input.type == "checkbox"}}
                         <checkbox-input config={{input}} />
                      {{/if}}
                  </div>
              {{/each}}
  
              <div style="display:flex">
                  <button type="button" class="btn btn-outline-danger" style="width:20%;margin-right: 1%;" id="settings_clear" on-click="@this.clearForm()">Clear</button>
                  <button type="button" class="btn btn-primary" style="width:80%" id="settings_submit" data-bs-dismiss="modal" on-click="@this.submitForm()">Submit</button>
              </div>
          </form>
      `,
  submitForm: function () {
    console.log("SUBMIT");
  },
  clearForm: function () {
    this.get("form_fields").forEach((field) => {
      field.value = "";
    });
    window[this.get("global_variable")] = {};
  },

  oncomplete: function () {
    if (!window[this.get("global_variable")]) {
      window[this.get("global_variable")] = {};
    }
    if (!window.ractive_forms) {
      window.ractive_forms = [];
    }
    window.ractive_forms.push(this);
    let self = this;
    window.formT = this;
    let form = this.find("form");
    let form_inputs = Array.from(form.getElementsByTagName("input"));
    let form_selects = Array.from(form.getElementsByTagName("select"));
    form_selects = form_selects.filter(
      (select) => select.getAttribute("range_select") == null
    );
    let form_fields = form_inputs.concat(form_selects);
    let form_fields_names = this.get("config")
      .map((el) => el.field)
      .filter((el) => el != undefined);

    this.set("form_fields", form_fields);
    this.set("form_fields_names", form_fields_names);
  },
});
Ractive.components["divider"] = Ractive.extend({
  template: `
        <label>- {{config.label}}</label>
        <hr>
    `,
});
Ractive.components["range-input"] = Ractive.extend({
  data: { selected_step: 1, values: { from: 0, to: 0 } },
  template: `

  {{#if !config.noLabel}}
  <label class="form-label">{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }}{{/if}} {{#if config.tooltip && typeof config.tooltip == "string" && config.tooltip != ""}} <a style="margin-left:0.5em" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title="{{config.tooltip}}" > <i class="fa-sharp fa-solid fa-circle-info" style="color: #8f8f8f"></i> </a> {{/if}}           </label>
  {{/if}}

        <div class="input-group mb-3">
            <span class="input-group-text">{{#if config.rangeLabels && config.rangeLabels[0]}} {{config.rangeLabels[0]}} {{else}} from {{/if}}</span>
                <input type="number" id="{{config.field + '_from'}}" class="form-control" step="{{selected_step}}" value="{{values.from}}" on-input="@this.precisionValidation(@node)"  >
            <span class="input-group-text">{{#if config.rangeLabels && config.rangeLabels[1]}} {{config.rangeLabels[1]}} {{else}} to {{/if}}</span>
                <input type="number" id="{{config.field + '_to' }}" class="form-control" step="{{selected_step}}" value="{{values.to}}" on-input="@this.precisionValidation(@node)">
            {{#if config.steps}}
                <span class="input-group-text">step</span>
                    <select style="width: max-content;" class="input-group-text " value="{{selected_step}}" range_select="true" >
                        {{#if Array.isArray(config.steps)}}
                            {{#each config.steps as step}}
                                <option value="{{step}}">{{step}}</option>
                            {{/each}}
                        {{else}}
                            <option value="1" selected>1</option>
                            <option value="0.1">0.1</option>
                        {{/if}}
                    </select>
            {{/if}}
        </div>
    `,
  precisionValidation: function (node) {
    let value = node.value;
    let decimal_number = node.step.length - 2 > 0 ? node.step.length - 2 : 0;
    let new_value = Number(value).toFixed(decimal_number);

    if (value.toString().length <= new_value.toString().length) {
      return;
    } else {
      node.value = new_value;
    }
  },
  onrender: function () {
    if (this.get("config").selected_step) {
      this.set("selected_step", this.get("config").selected_step);
    }

    if (!window[this.parent.get("global_variable")]) {
      window[this.parent.get("global_variable")] = {};
    }
    window.comp_range = this;
    // this.set("values", { from: 0, to: 0 });

    this.observe("values", (newValue, oldValue) => {
      console.log("VVAAAAAAAA", newValue);
      if (newValue.to >= 0) {
        var new_field = [];
        for (
          var i = +newValue.from;
          i <= +newValue.to;
          i += Number(this.get("selected_step"))
        ) {
          let new_i = +i;
          if (i.toString().includes(".")) {
            new_i = new_i.toString().split(".");
            new_i.shift();
            new_i = new_i.length;
            new_field.push(+i.toFixed(new_i));
          } else {
            new_field.push(+i);
          }
        }
        this.root.set(`formData.${this.get("config.field")}`, new_field);
        window[this.parent.get("global_variable")][this.get("config.field")] =
          new_field;
      }
    });
  },
});
Ractive.components["date-input"] = Ractive.extend({
  data: {
    values: {
      from: "",
      to: "",
    },
  },
  template: `
  {{#if !config.noLabel}}
  <label class="form-label">{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }}{{/if}} (mm/dd/yyyy)  {{#if config.tooltip && typeof config.tooltip == "string" && config.tooltip != ""}} <a style="margin-left:0.5em" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title="{{config.tooltip}}" > <i class="fa-sharp fa-solid fa-circle-info" style="color: #8f8f8f"></i> </a> {{/if}}           </label>
  {{/if}}

    {{#if config.range}}
        <div class="input-group mb-3">
            <label class="input-group-text">From:</label>
            <input type="date" class="form-control" id="{{config.field + "_from"}}" min="{{min_value}}" max="{{max_value}}" value="{{values.from}}"  />
        </div>  
        <div class="input-group mb-3">
            <label class="input-group-text">To:</label>
            <input type="date" class="form-control" id="{{config.field + "_to"}}" min="{{min_value}}" max="{{max_value}}"  value="{{values.to}}" />
        </div>  
    {{else}}
    <label class="form-label" >{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }} {{/if}}</label>
        <input type="date" class="form-control" id="{{config.field}}"  />
    {{/if}}
    `,
  onrender: function () {
    if (!window[this.parent.get("global_variable")]) {
      window[this.parent.get("global_variable")] = {};
    }

    window.comp_date_range = this;
    this.root.observe(
      "formData.symbols formData.timeframe",
      (newValue, oldValue, path) => {
        let symbol = this.root.get("formData.symbols.0");
        let timeframe = this.root.get("formData.timeframe");
        console.log("CHANGE_____", newValue, symbol, timeframe);
        let min = all_available_dates[symbol][timeframe].from;
        let max = all_available_dates[symbol][timeframe].to;

        this.set("min_value", min);
        this.set("max_value", max);
        this.set("values.from", min);
        this.set("values.to", max);
      }
    );

    this.observe("values", (newValue, oldValue) => {
      if (newValue.to) {
        window[this.parent.get("global_variable")][this.get("config.field")] =
          newValue;
        this.root.set(`formData.${this.get("config.field")}`, newValue);
      }
    });
  },
});
Ractive.components["toast"] = Ractive.extend({
  template: `
    {{#if type=="error"}}
      <div class="toast-container  position-fixed bottom-0 end-0 p-3">
        <div id="toast_component" class="toast text-bg-danger" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header">
            <strong class="me-auto">{{title || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body">
            {{text}}
          </div>
        </div>
      </div>
    {{elseif type=="success"}}
      <div class="toast-container  position-fixed bottom-0 end-0 p-3">
        <div id="toast_component" class="toast text-bg-success" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header">
            <strong class="me-auto">{{title || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body">
            {{text}}
          </div>
        </div>
      </div>
    {{else}}
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div id="toast_component" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <strong class="me-auto">Bootstrap</strong>
        <small>11 mins ago</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        Hello, world! This is a toast message.
      </div>
    </div>
  </div>
    {{/if}}



  `,
  oncomplete: function () {
    let selfEl = this.find("#toast_component");
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(selfEl);
    toastBootstrap.show();
    this.unrender();
  },
});
Ractive.components["select-input"] = Ractive.extend({
  data: {
    selectedValues: [],
  },
  template: `
  {{#if !config.noLabel}}
  <label class="form-label">{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }}{{/if}} {{#if config.tooltip && typeof config.tooltip == "string" && config.tooltip != ""}} <a style="margin-left:0.5em" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title="{{config.tooltip}}" > <i class="fa-sharp fa-solid fa-circle-info" style="color: #8f8f8f"></i> </a> {{/if}}           </label>
  {{/if}}
            <select class="form-select" id="{{config.field}}" value="{{value}}">  
                {{#each config.options as option}}
                    {{#if typeof option == "string"}}
                        <option {{#if config.multiple && selectedValues && selectedValues.includes(option)}}style="background:#0d6efd61;font-style:italic;color:white"{{/if}} value="{{option}}" >{{option}}</option>
                    {{else}}
                        <option {{#if config.multiple && selectedValues && selectedValues.includes(option)}}style="background:#0d6efd61;font-style:italic;color:white"{{/if}} value="{{option.value}}">{{option.text}}</option>
                    {{/if}}
                {{/each}}
            </select> 

        {{#if config.multiple}}
        <ul class="nav nav-pills" style="margin-top:1em;font-size: small;">
          {{#each selectedValues as val:index}}
            <li on-click="@this.removeValue(index)" class="nav-item" style="margin:0.2em">
              <a class="nav-link active">{{.}}</a>
            </li>
          {{/each}}
          </ul>
        {{/if}}          
      `,
  removeValue: function (index) {
    this.splice("selectedValues", index, 1);
  },
  oncomplete: function () {
    this.observe("value", (newValue, oldValue) => {
      if (newValue != "") {
        if (this.get("config.multiple")) {
          var index = this.get("selectedValues").indexOf(newValue);
          if (index !== -1) {
            this.splice("selectedValues", index, 1);
          } else {
            this.push("selectedValues", newValue);
          }
          window[this.parent.get("global_variable")][this.get("config.field")] =
            this.get("selectedValues");
          this.root.set(
            `formData.${this.get("config.field")}`,
            this.get("selectedValues")
          );
        } else {
          window[this.parent.get("global_variable")][this.get("config.field")] =
            newValue;
          this.root.set(`formData.${this.get("config.field")}`, newValue);
        }
      }
    });
  },
});
Ractive.components["dropdown-input"] = Ractive.extend({
  data: { showMenu: false, selectedItems: [] },
  template: `
    <div class="dropdown" >
      <a class="btn btn-secondary dropdown-toggle" id="{{config.field}}">
        {{#if config.multiple}}
              {{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }} {{/if}}
        {{/if}}
              {{selectedItems[0]}}
      </a>
      <ul class="dropdown-menu  {{#if showMenu}}show{{/if}}"  style="width: 100%;height:20vh;overflow-y: scroll;">
        {{#each config.options as option}}
          {{#if typeof option == "string"}}
            <li><a class="dropdown-item" data-val="{{option}}">{{option}}</a></li>
          {{else}}
            <li><a class="dropdown-item" data-val="{{option.value}}">{{option.text}}</a></li>
          {{/if}}
        {{/each}}
      </ul>
      {{#if selectedItems.length>0}}
        <ul class="nav nav-pills" style="margin-top:1em;font-size: small;">
          {{#each selectedItems as val:index}}
            <li on-click="@this.removeValue(index)" class="nav-item" style="margin:0.2em">
              <a class="nav-link active">{{val}}</a>
            </li>
          {{/each}}
        </ul>
      {{/if}}



  </div>
  `,
  removeValue: function (index) {
    this.splice("selectedItems", index, 1);
  },
  oncomplete: function () {
    let self = this;
    let options = self.findAll(".dropdown-item");
    let dropdown = self.find(`#${self.get("config.field")}`);

    this.clearItems = () => {
      this.set("selectedItems", []);
      Array.from(options).forEach((option) => {
        option.classList.remove("selected_item");
      });
    };
    this.toggleItem = (val) => {
      let index = this.get("selectedItems").findIndex((el) => el == val);
      if (index == -1) {
        this.push("selectedItems", val);
      } else {
        this.splice("selectedItems", index, 1);
      }
    };

    dropdown.onclick = () => {
      this.set("showMenu", !this.get("showMenu"));
    };
    Array.from(options).forEach((option) => {
      option.onclick = (ev) => {
        ev.target.classList.toggle("selected_item");
        let value = ev.target.getAttribute("data-val");
        this.toggleItem(value);
      };
    });

    this.observe("selectedItems", (newValue, oldValue) => {
      if (!this.get("config.multiple") && newValue.length > 1) {
        clearItems();
        this.toggleItem(newValue[0]);
        window[this.parent.get("global_variable")][this.get("config.field")] =
          newValue[0];
        this.root.set(`formData.${this.get("config.field")}`, newValue[0]);
      } else {
        this.toggleItem(newValue);
        window[this.parent.get("global_variable")][this.get("config.field")] =
          this.get("selectedItems");
        this.root.set(
          `formData.${this.get("config.field")}`,
          this.get("selectedItems")
        );
      }
    });

    console.log("OPTIONS", options, dropdown);
  },
});
Ractive.components["checkbox-input"] = Ractive.extend({
  template: `
  {{#if !config.noLabel}}
  <label class="form-label">{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }}{{/if}} {{#if config.tooltip && typeof config.tooltip == "string" && config.tooltip != ""}} <a style="margin-left:0.5em" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title="{{config.tooltip}}" > <i class="fa-sharp fa-solid fa-circle-info" style="color: #8f8f8f"></i> </a> {{/if}}           </label>
  {{/if}}

<div class="form-check">
 <input class="form-check-input" type="checkbox" {{#if config.defaultValue}} checked="" {{/if}}  on-change="@this.valueChanged(@event)" id="flexCheckDefault">
 <label class="form-label">{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }} {{/if}}</label>
</div>
  `,
  valueChanged: function (ev) {
    console.log("VALUE_CHANGED", ev.target.checked);
    window[this.parent.get("global_variable")][this.get("config.field")] =
      ev.target.checked;
    this.root.set(`formData.${this.get("config.field")}`, ev.target.checked);
  },
  oncomplete: function () {
    window[this.parent.get("global_variable")][this.get("config.field")] =
      this.get("config.defaultValue");
    this.root.set(
      `formData.${this.get("config.field")}`,
      this.get("config.defaultValue")
    );
  },
});
Ractive.components["text-input"] = Ractive.extend({
  template: `
  {{#if !config.noLabel}}
  <label class="form-label">{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }}{{/if}} {{#if config.tooltip && typeof config.tooltip == "string" && config.tooltip != ""}} <a style="margin-left:0.5em" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title="{{config.tooltip}}" > <i class="fa-sharp fa-solid fa-circle-info" style="color: #8f8f8f"></i> </a> {{/if}}           </label>
  {{/if}}
  <div class="input-group mb-3">
  {{#if config.button && (!config.button.side || config.button.side=="left")}}
    <button class="btn btn-outline-{{config.button.type || 'secondary'}}" type="button">{{config.button.text}}</button>
  {{/if}}
    <input type="text" id="{{config.field}}" class="form-control" placeholder="{{config.placeholder}}" value="{{input_value||config.value }}"/>
  {{#if config.button &&  config.button.side=="right"}}
    <button class="btn btn-outline-{{config.button.type || 'secondary'}}" type="button">{{config.button.text}}</button>
  {{/if}}
  </div>
  `,
});
Ractive.components["multifield"] = Ractive.extend({
  data: {
    condition: true,
    config_item: {
      field: "Item",
      button: { text: "Delete", side: "right", type: "danger" },
    },
  },
  isolated: true,
  template: `
  {{#if condition}}
  {{#if !config.noLabel}}
  <label class="form-label">{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }}{{/if}} {{#if config.tooltip && typeof config.tooltip == "string" && config.tooltip != ""}} <a style="margin-left:0.5em" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title="{{config.tooltip}}" > <i class="fa-sharp fa-solid fa-circle-info" style="color: #8f8f8f"></i> </a> {{/if}}           </label>
  {{/if}}

    {{#each items as item:index}}
      <div class="input-group mb-3">
      {{#if config_item.button && (!config_item.button.side || config_item.button.side=="left")}}
        <button on-click="@this.deleteItem(index)" class="btn btn-outline-{{config_item.button.type || 'secondary'}}" type="button">{{config_item.button.text}}</button>
      {{/if}}
        <input type="text" id="{{config_item.field}}" class="form-control" placeholder="{{config_item.placeholder}}" value="{{item.value.from}}"/>
        <input type="text" id="{{config_item.field}}" class="form-control" placeholder="{{config_item.placeholder}}" value="{{item.value.to}}"/>
      {{#if config_item.button &&  config_item.button.side=="right"}}
        <button on-click="@this.deleteItem(index)" class="btn btn-outline-{{config_item.button.type || 'secondary'}}" type="button">{{config_item.button.text}}</button>
      {{/if}}
      </div>
    {{/each}}

      <button on-click="@this.addItem()" type="button"  class="btn btn-outline-info">Add +</button>
      {{/if}}
  `,
  addItem: function () {
    this.push("items", {});
    let itemsLen = this.get("items").length - 1;
    this.set(`items.${itemsLen}`, { value: { from: "00:00", to: "24:00" } });
  },
  deleteItem: function (index) {
    this.splice("items", index, 1);
  },
  onrender: function () {
    if (!window.multifield) {
      window.multifield = {};
    }
    window.multifield[this.get("config.field")] = this;

    this.set("items", [{ value: { from: "00:00", to: "24:00" } }]);

    this.observe("items", (newVal, oldVal) => {
      //Items value == data
      let temp_data = newVal.map((item) => {
        return { ...item.value };
      });
      this.set("data", temp_data);
    });

    this.root.observe("formData", (newVal, oldVal) => {
      if (this.get("config.condition")) {
        let cond = this.get("config.condition");
        if (newVal[cond.trigger] != undefined) {
          if (newVal[cond.trigger] == cond.value) {
            if (cond.type == "display") {
              this.set("condition", true);
            }
            if (cond.type == "disable") {
              this.set("condition", true);
            }
          } else {
            this.set("condition", false);
          }
        }
      }
    });

    this.observe("data", (newVal, oldVal) => {
      let newData = newVal;
      if (this.get("parse_data")) {
      } else {
        newVal.forEach((el, index) => {
          newData[index].from = el.from.replaceAll(":", "");
          newData[index].to = el.to.replaceAll(":", "");
        });
      }
      this.root.set(`formData.${this.get("config.field")}`, newData);
      window[this.parent.get("global_variable")][this.get("config.field")] =
        newData;
    });
  },
});
