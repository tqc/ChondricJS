            (function ($) {
                $.fn.listSync = function (rawdata, options) {
                    // populate a list using the template
                    var container = this;


                    var settings = {
                        // selector for items. applies to both the view and the template
                        itemClass: "result",

                        // property of the data object that can be used as a unique identifier
                        dataId: "dataId",
						
                        // function for populating a subview
                        itemMapper: function (subView, itemData) {

                        }

                    }

                    if (!options) {
                        // options are optional for subsequent calls
                        options = container.data("options");
                    }

                    if (options) {
                        container.data("options", options);
                        $.extend(settings, options);
                    }


                    // get the template
                    var template = $(">." + settings.itemClass + "[data-role='viewTemplate']", container);


                    // get the data in the right form - rawdata may be array or map
                  
                  
                    var data = [];
                    if (rawdata instanceof Array) {
                    	data = rawdata;
                    }
                    else {
                    	for (n in rawdata) {
                    		data.push(rawdata[n]);
                    	}
                    }

					if (data.length == 0) {
						container.addClass("emptylist");
					}
					else {
						container.removeClass("emptylist");
					}


                    var getSubView = function (itemdata) {
                        var dataid = itemdata[settings.dataId];
                        var subView = $(">." + settings.itemClass + "[data-role='view'][data-id='" + dataid + "']", container);

                        if (!subView || subView.length <= 0) {
                            // the subview does not yet exist - create it

                            subView = template.clone();
                            subView.attr("data-role", "view");
                            subView.attr("data-id", dataid);
                            subView.insertBefore(template);

                        }

                        // the subview exists - populate it

                        $("[data-role='autopopulate']", subView).each(function () {
                            // simple properties can be handled declaratively
                            var element = $(this);

                            // skip items that are not immediate children of the subview - i.e. they have
                            // no viewTemplate ancestor and the closest view ancestor is this subview
                            var viewTemplateAncestor = $(this).closest("[data-role=viewTemplate]");
                            var viewAncestor = $(this).closest("[data-role=view]");
                            if (viewTemplateAncestor.length > 0) return;
                            if (viewAncestor[0] != subView[0]) return;

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

