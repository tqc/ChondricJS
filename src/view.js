Chondric.QuickView = function(container, options) {
    var view = this;
    var settings = {
        fields: {}
    }

    $.extend(settings, options);


    view.onControlValueChanged = function(field, knownNewVal) {
        var newVal = knownNewVal;
        if (newVal === undefined) {
            if (field.get) {
                // custom getter
                newVal = field.get(field.element)
            } else if (field.fieldType == "checkbox") {
                newVal = field.element.is(":checked");
            } else if (field.fieldType == "listValueSingle") {
                newVal = $(">.active", field.element).attr("data-id");
            } else {
                newVal = field.element.val();
            }
        }
        if (newVal != field.currentValue) {
            field.currentValue = newVal;
            if (field.change) {
                field.change.apply(field, [field.currentValue]);
            }
        }

    }

    this.initField = function(fieldname) {
        var field = settings.fields[fieldname];
        if (!field) {
            console.error("field " +fieldname+ " not found");
            return;
        }

        if (!field.fieldType) field.fieldType = "textbox";

        if (field.init) field.init();


        if (field.selector && field.element == undefined) {
            field.element = $(field.selector, container);
            if (field.fieldType != "list") {
                console.log("init " + field.element.attr("id"));
                field.element.bind("change keyup", function() {
                    view.onControlValueChanged(field);
                });
            }
        }
    }

    // clone the fields so that the fields passed in the options can be reused
    var f2 = settings.fields;
    settings.fields = {};
    for (var fn in f2) {
        settings.fields[fn] = $.extend({}, f2[fn])
        view.initField(fn);
    }

    this.prop = function(fieldname, value, shouldTriggerChange) {
        var field = settings.fields[fieldname];
        if (!field) {
            console.error("field " +fieldname+ " not found");
            return;
        }
        // init field if not already set up
        if (field.selector && field.element == undefined) {
            view.initField(fieldname);
        }
        if (value === undefined) {
            if (field.currentValue === undefined) {
                if (field.get) {
                    // custom getter
                    console.log("custom get " + fieldname);

                    return field.currentValue = field.get(field.element)
                } else {
                    console.log("standard get " + fieldname);
                    if (field.fieldType == "checkbox") {
                        return field.element.is(":checked");
                    } else if (field.fieldType == "listValueSingle") {
                        return $(">.active", field.element).attr("data-id");
                    } else {
                        return field.currentValue = field.element.val();
                    }
                }
            } else {
                console.log("get from cache " + fieldname);
                return field.currentValue;
            }
            // get value;
        } else {
            // set value
            if ((field.hasChanged && !field.hasChanged(field.currentValue, value)) || (!field.hasChanged && value == field.currentValue)) {
                console.log("unchanged " + fieldname);
                return;
            }
            if (field.set) {
                // custom setter
                console.log("custom set " + fieldname);
                field.currentValue = field.set(field.element, field.currentValue = value)
            } else {
                console.log("standard set " + fieldname);
                if (field.fieldType == "checkbox") {
                    field.element.attr("checked", field.currentValue = value).checkboxradio('refresh');
                } else if (field.fieldType == "listValueSingle") {
                    $(">.active", field.element).removeClass("active");
                    $(">[data-id=" + (field.currentValue = value) + "]", field.element).addClass("active");

                } else {
                    field.element.val(field.currentValue = value);
                }
                if (field.fieldType == "slider") {
                    field.element.slider("refresh");
                }
            }
            console.log("changed " + fieldname);
            if (shouldTriggerChange && field.change) {
                console.log("calling change " + fieldname);
                field.change(field.currentValue);
            }

        }
    };


    this.invalidate = function(fieldname) {
        if (fieldname == undefined) {
            for (var fn in settings.fields) {
                delete settings.fields[fn].currentValue;
            }
        } else {
            var field = settings.fields[fieldname];
            if (!field) {
            console.error("field " +fieldname+ " not found");
                return;
            }
            delete field.currentValue;
        }



    };

};