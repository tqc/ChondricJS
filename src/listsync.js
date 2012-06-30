            (function($) {

                $.fn.listSync = function(rawdata, options) {
                    // populate a list using the template
                    var container = this;

                    var settings = container.data("listSyncSettings");

                    if (!settings) {
                        // first call of listSync
                        settings = {
                            // selector for items. applies to both the view and the template
                            itemClass: "result",

                            // property of the data object that can be used as a unique identifier
                            dataId: "dataId",
                            selectionMode: "none",
                            sortList:true,


                            // function for populating a subview
                            itemMapper: function(subView, itemData) {

                            }
                        }
                        $.extend(settings, options);

                        // get the template
                        settings.templateElement = $(">." + settings.itemClass + "[data-role='viewTemplate']", container);

                        // parse the template so that we know which properties are needed for change detection
                        settings.populatedProperties = {};

                        settings.populatedProperties[settings.dataId] = true;

                        $("[data-role='autopopulate']", settings.templateElement).each(function() {
                            // simple properties can be handled declaratively
                            // skip items that are not immediate children of the subview - i.e. the closest view template ancestor is the current template
                            var viewTemplateAncestor = $(this).closest("[data-role=viewTemplate]");
                            if (viewTemplateAncestor[0] != settings.templateElement[0]) {
                                settings.hasSubviews = true;
                                return;
                            }
                            var propName = $(this).attr("data-property");
                            settings.populatedProperties[propName] = true;
                        });


                        if (settings.selectionMode == "single") {
                            // TODO: these selectors don't support subviews
                            // ">[data-role=view]" is apparently not valid with on.
                            container.on("vclick", "."+settings.itemClass, function() {
                                var btn = $(this);
                                $(">.active", container).removeClass("active");
                                btn.addClass("active");
                                container.trigger("change");
                            });

                        } else if (settings.selectionMode == "multiple") {
                            container.on("vclick", "."+settings.itemClass, function() {
                                $(this).toggleClass("active");
                                container.trigger("change");
                            });
                        }

                        // list items which have already been displayed so can be reused
                        settings.renderedElements = {};


                        // initialize with any preexisting list items
    var children = container.children();
    for (var i = 0; i < children.length; i++) {
        var el = $(children[i]);
        if (el.attr("data-role") == "view") {
            settings.renderedElements[el.attr("data-id")] = el;
        }
            }


                        container.data("listSyncSettings", settings);
                    }

                    if (options) {
                        // options are optional for subsequent calls
                        $.extend(settings, options);
                        container.data("listSyncSettings", settings);
                    }

                    // normalize the input data. we always want an array for ordering and a map with 
                    // key matching data id for easy updating of individual items.
                    var orderedKeys = [];
                    var data = {};

                    if (rawdata instanceof Array) {
                        for (var i = 0; i < rawdata.length; i++) {
                            var o = rawdata[i];
                            var k = o[settings.dataId];
                            orderedKeys.push(k);
                            data[k] = o;
                        }
                    } else {
                        for (n in rawdata) {
                            var o = rawdata[n];
                            var k = o[settings.dataId];
                            orderedKeys.push(k);
                            data[k] = o;
                        }
                    }

                    if (orderedKeys.length == 0) {
                        container.addClass("emptylist");
                        for (var k in settings.renderedElements) {
                            settings.renderedElements[k].remove();
                           }
                           settings.renderedElements = {};
                           return;
                    } else {
                        container.removeClass("emptylist");
                    }


                    // list elements for the current iteration - includes previously rendered and new elements
                    // will be copied as settings.renderedElements later.
                    var listItemElements = {};



/************************************/
/* Local functions */
/************************************/

                    var itemHasChanged = function(previousData, newData) {
                            if (!previousData) return true;
                            if (settings.itemHasChanged) {
                                return settings.itemHasChanged(previousData, newData)
                            } else {
                                for (var pn in settings.populatedProperties) {
                                    if (previousData[pn] != newData[pn]) return true;
                                }
                                return false;
                            }
                        }

                    var getMonitoredValues = function(itemdata) {
                            var result = {};
                            for (var pn in settings.populatedProperties) {
                                result[pn] = itemdata[pn];
                            }
                            return result;
                        }

                    var getSubView = function(itemdata) {
                            var dataId = itemdata[settings.dataId];
                            var subView = listItemElements[dataId];


                            if (!subView) {
                                // the subview does not yet exist - create it
                                subView = settings.templateElement.clone();
                                subView.attr("data-role", "view");
                                subView.attr("data-id", dataId);

                                subView.appendTo(container);
                                listItemElements[dataId] = subView;
                            }

                            var previousData = subView.data("populatedValues");

                            var newValues = getMonitoredValues(itemdata);

                            if (!itemHasChanged(previousData, newValues)) return;

                            subView.data("populatedValues", newValues);
                            subView.data("originalItem", itemdata);

                            // data has changed - populate the subview
                            $("[data-role='autopopulate']", subView).each(function() {
                                // simple properties can be handled declaratively
                                var element = $(this);

                                if (settings.hasSubviews) {
                                    // skip items that are not immediate children of the subview - i.e. they have
                                    // no viewTemplate ancestor and the closest view ancestor is this subview
                                    var viewTemplateAncestor = $(this).closest("[data-role=viewTemplate]");
                                    var viewAncestor = $(this).closest("[data-role=view]");
                                    if (viewTemplateAncestor.length > 0) return;
                                    if (viewAncestor[0] != subView[0]) return;
                                }

                                var propName = $(this).attr("data-property");
                                var val = itemdata[propName];
                                element.html(val);
                            });


                            if (settings.itemMapper) {
                                settings.itemMapper(subView, itemdata)
                            }

                            return subView;
                        }
/************************************/
/* End local functions */
/************************************/




                    // iterate over previously rendered items, see if any need removing

                    for (var k in settings.renderedElements) {
                        var el = settings.renderedElements[k];
                        if (!data[k]) {
                            // data no longer contains this item - remove it
                            el.remove();
                           } else {
                            listItemElements[k] = el;
                           }
                        }

                    // iterate over data, adding and updating elements as necessary

                    for (var i = 0; i < orderedKeys.length; i++) {
                        var el = getSubView(data[orderedKeys[i]]);
                    }

                    settings.renderedElements = listItemElements;

                    if (settings.sortList) {
                        var domElements = $("[data-role=view]", container);
                        var domIndex = 0;
                        var keyIndex = 0;

                        var sortedKeys = {};
                        while (keyIndex < sortedKeys.length && domIndex < domElements.length) {                             
                             var expected = orderedKeys[keyIndex];
                             var actual = $(domElements[domIndex]).attr("data-id");
                             if (expected == actual) {
                                domIndex++;
                                keyIndex++;
                                sortedKeys[actual] = true;
                                continue;
                             }
                             if (sortedKeys[expected]) {
                                keyIndex++;
                                continue;
                             }
                             if (sortedKeys[actual]) {
                                domIndex++;
                                continue;
                             }

                             listItemElements[expected].insertBefore(domElements[domIndex]);
                        }
                    }


                    return this;
                };
            })(jQuery);