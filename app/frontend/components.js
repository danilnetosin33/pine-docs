Ractive.components["form-builder"] = Ractive.extend({
  template: `
          <form>
              {{#each config as input}}
                  <div class="mb-3">
                      {{#if input.type == "range"}}
                        <range-input config={{input}}  />
                      {{elseif input.type == "divider"}}
                        <divider config={{input}} />
                      {{elseif input.type == "select"}}
                        <select-input config={{input}} />
                      {{elseif input.type == "date"}}
                        <date-input config={{input}} />
                      {{else}}
                          aaaa
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
  template: `
        <label class="form-label" >{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }} {{/if}}</label>
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
                            <option selected>0</option>
                            <option value="0.1">0.1</option>
                            <option value="0.01">0.01</option>
                            <option value="0.001">0.001</option>
                        {{/if}}
                    </select>
            {{/if}}
        </div>
    `,
  precisionValidation: function (node) {
    console.log("VALUEEEEESSS", this.get("values"));

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
    if (!window[this.parent.get("global_variable")]) {
      window[this.parent.get("global_variable")] = {};
    }
    window.comp_range = this;
    this.set("values", { from: 0, to: 0 });

    this.observe("values", (newValue, oldValue) => {
      if (newValue.to > 0) {
        var new_field = [];
        for (var i = +newValue.from; i <= +newValue.to; i++) {
          new_field.push(i);
        }
        window[this.parent.get("global_variable")][this.get("config.field")] =
          new_field;
      }
    });
  },
});
Ractive.components["select-input"] = Ractive.extend({
  template: `
        <label class="form-label">{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }} {{/if}}</label>
            <select class="form-select" id="{{config.field}}" value="{{value}}">  
                {{#each config.options as option}}
                    {{#if typeof option == "string"}}
                        <option value="{{option}}">{{option}}</option>
                    {{else}}
                        <option value="{{option.value}}">{{option.text}}</option>
                    {{/if}}
                {{/each}}
            </select> 
      `,
  oncomplete: function () {
    this.observe("value", (newValue, oldValue) => {
      if (newValue != "") {
        window[this.parent.get("global_variable")][this.get("config.field")] =
          newValue;
      }
    });
  },
});
Ractive.components["date-input"] = Ractive.extend({
  template: `
    {{#if config.range}}
    <label class="form-label" >{{#if config.label}} {{config.label}} {{else}} {{ config.field.charAt(0).toUpperCase() + config.field.slice(1).toLowerCase() }} {{/if}}</label>
        <div class="input-group mb-3">
            <label class="input-group-text">From:</label>
            <input type="date" class="form-control" id="{{config.field + "_from"}}"  value="{{values.from}}"  />
        </div>  
        <div class="input-group mb-3">
            <label class="input-group-text">To:</label>
            <input type="date" class="form-control" id="{{config.field + "_to"}}"  value="{{values.to}}" />
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
    window.comp_range = this;
    this.set("values", {});

    this.observe("values", (newValue, oldValue) => {
      if (newValue.to) {
        window[this.parent.get("global_variable")][this.get("config.field")] =
          newValue;
      }
    });
  },
});
