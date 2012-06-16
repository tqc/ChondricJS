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


                        container.data("listSyncSettings", settings);
                    }

                    if (options) {
                        // options are optional for subsequent calls
                        $.extend(settings, options);
                        container.data("listSyncSettings", settings);
                    }


                    // map data id to list elements to reduce dom queries
                    var listItemElements = {};



                    // get the data in the right form - rawdata may be array or map
                    var data = [];
                    if (rawdata instanceof Array) {
                        data = rawdata;
                    } else {
                        for (n in rawdata) {
                            data.push(rawdata[n]);
                        }
                    }

                    if (data.length == 0) {
                        container.addClass("emptylist");
                    } else {
                        container.removeClass("emptylist");
                    }

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

                                subView.insertBefore(settings.templateElement);
                                listItemElements[dataId] = subView;
                            }

                            var previousData = subView.data("populatedValues");

                            var newValues = getMonitoredValues(itemdata);

                            if (!itemHasChanged(previousData, newValues)) return;

                            subView.data("populatedValues", newValues);

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


                    var dataItemCount = 0;

                    var subviewelements = [];
                    for (var i = 0; i < data.length; i++) {
                        subviewelements.push(getSubView(data[i]));
                        dataItemCount++;
                    }

                    // ensure that list items are in the correct order and deleted items have been removed
                    // first, move all the valid items to the end of the list
                    for (var i = 0; i < dataItemCount; i++) {
                        subviewelements[i].appendTo(container);
                    }
                    // then remove any excess elements that are still at the start of the lsit
                    var existingviewelements = $(">." + settings.itemClass + "[data-role='view']", container);
                    for (var i = 0; i < existingviewelements.length - dataItemCount; i++) {
                        $(existingviewelements[i]).remove();
                    }


                    return this;
                };
            })(jQuery);