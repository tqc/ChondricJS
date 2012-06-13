Chondric.QuickView = function(container, options) {
        var view = this;
        var settings = {
            change: function(val) {},
            fields: {}
        }

        $.extend(settings, options);


        this.initField = function(fieldname) {
            var field = settings.fields[fieldname];
            if (!field) {
                console.log("field not found");
                return;
            }

            if (field.selector && field.element == undefined) {
                field.element = $(field.selector, container);

                field.element.bind("change keyup", function() {
                    var newVal = undefined;
                    if (field.get) {
                        // custom getter
                        console.log("custom get on change " + fieldname);
                        newVal = field.get(field.element)
                    } else {
                        console.log("standard get on change " + fieldname);
                        newVal = field.element.val();
                    }

                    if (newVal != field.currentValue) {
                        field.currentValue = newVal;
                        console.log("changed " + fieldname);
                        if (field.change) {
                            console.log("calling change " + fieldname);
                            field.change(field.currentValue);
                        }
                    }


                });

            }
        }

        for (var fn in settings.fields) {
            view.initField(fn);
        }

        this.prop = function(fieldname, value, shouldTriggerChange) {
            var field = settings.fields[fieldname];
            if (!field) {
                console.log("field not found");
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

                        return field.currentValue = field.element.val();
                    }
                } else {
                    console.log("get from cache " + fieldname);
                    return field.currentValue;
                }
                // get value;
            } else {
                // set value
                if (value == field.currentValue) {
                    console.log("unchanged " + fieldname);
                    return;
                }
                if (field.set) {
                    // custom setter
                    console.log("custom set " + fieldname);
                    field.currentValue = field.set(field.element, field.currentValue = value)
                } else {
                    console.log("standard set " + fieldname);
                    field.element.val(field.currentValue = value);
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
                    console.log("field not found");
                    return;
                }
                delete field.currentValue;
            }



        };

    };