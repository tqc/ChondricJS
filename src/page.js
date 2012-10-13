Chondric.Page = function(options) {
    var page = this;

    var settings = {
        getViewModel: function(callback, pagehidden, partialupdate) {
            callback()
        },
        customEvents: function(pagediv) {},
        customValidation: function() {},
        save: function() {},
        customViewUpdate: function(pagediv, m, pagehidden, partialupdate) {},
        directionalNavigation: [],
        showNavbars: true,
        variations: {}

    }

    $.extend(settings, options);

    this.getViewModel = function(callback, pagehidden, partialupdate) {
        var page = this;
        settings.getViewModel.call(page, function(m) {
            page.model = m;
            callback(m);
        }, pagehidden, partialupdate);
    }

    this.attachEvents = function(pagediv) {
        // attach events for the pages subviews using live - this runs on page create, so in updateview
        // we only need to update the dom elements / attributes
        // all syncronous and does not rely on anything being loaded until the event handlers are called.
        var page = this;

        // split directional nav array


        // bind swipe events
/*
        $(pagediv).bind("swipe", function(e, data) {
            // TODO: work with separate swipeleft/swiperight events
            if (!settings.directionalNavigation[data.direction] ) return true;

            $(".swipenav." + data.direction).click();

            return false;
            // TODO: return true if no swipe event available

        })
*/
        $(pagediv).bind("swipeleft", function(e, data) {
            // TODO: work with separate swipeleft/swiperight events
            if (!settings.directionalNavigation.left) return true;

            $(".swipenav.left").click();

            return false;
            // TODO: return true if no swipe event available

        })

        $(pagediv).bind("swiperight", function(e, data) {
            // TODO: work with separate swipeleft/swiperight events
            if (!settings.directionalNavigation.right) return true;

            $(".swipenav.right").click();

            return false;
            // TODO: return true if no swipe event available

        })


        // saving for dialogs
        if (settings.rules) {
            // validation enabled

            $("#frmInput", pagediv).validate({
                rules: settings.rules,
                submitHandler: function(form) {
                    page.save.call(page, pagediv);
                    $('.ui-dialog').dialog('close');
                },
                invalidHandler: function(form, validator) {
                    var errors = validator.numberOfInvalids();
                    if (errors) {
                        //	var message = errors == 1 ? 'You missed 1 field. It has been highlighted' : 'You missed ' + errors + ' fields. They have been highlighted';
                        //	alert(message);
                    }
                }
            });

        } else {
            // no validation, just save
            $("#btnSave", pagediv).click(function() {
                page.save(pagediv);
                $('.ui-dialog').dialog('close');
                return false;
            });
        }

        $(pagediv).bind('orientationchange', function(event) {
            // for some reason changing back to portrait causes horizontal scrolling
            window.scrollTo(0, window.scrollY);

            page.updateView(pagediv, page.model)
        });

        settings.customEvents.call(page, pagediv)

        //  variation events

        for (var vn in settings.variations) {
            var vc = settings.variations[vn];
            if (!vc) {
                continue;
            }
            var vd = $("#" + vn, pagediv);
            if (vd.length != 1) {
                continue;
            }
            if (vc.attach) {
                vc.attach(page, vd);
            }
        }

    }

    this.save = function(pagediv) {

        // TODO: update model from field values

        var m = this.model;
        $("[data-role='autoedit']", pagediv).each(function() {
            // simple properties can be handled declaratively
            var element = $(this);

            // skip items that are not immediate children of the subview - i.e. they have
            // no viewTemplate ancestor and the closest view ancestor is this subview
            var viewTemplateAncestor = $(this).closest("[data-role=viewTemplate]");
            var viewAncestor = $(this).closest("[data-role=view],[data-role=page],[data-role=dialog]");
            if (viewTemplateAncestor.length > 0) return;
            if (viewAncestor[0] != pagediv) return;

            var propName = $(this).attr("data-property");
            m[propName] = element.val();
        });

        settings.save.call(page, pagediv, m);
    }

    function showDirectionalNav(pagediv, m) {

        var sidebars = {
            left: null,
            right: null,
            up: null,
            down: null
        }

        for (var i = 0; i < settings.directionalNavigation.length; i++) {
            var n = settings.directionalNavigation[i]
            if (!n.enabled || n.enabled(m)) {
                sidebars[n.direction] = n;
            }
        }

        for (var dir in sidebars) {
            var sbd = sidebars[dir]
            if (sbd) {
                if ($.isFunction(sbd.url)) {
                    $(".swipenav." + dir).attr("href", sbd.url(m));
                } else {
                    $(".swipenav." + dir).attr("href", sbd.url);
                }

                if ($.isFunction(sbd.title)) {
                    $(".swipenav." + dir).html(sbd.title(m));
                } else {
                    $(".swipenav." + dir).html(sbd.title);
                }


                $(".swipenav." + dir).addClass("enabled");

            } else {
                $(".swipenav." + dir).removeClass("enabled");
            }
        }


    }

    function updateViewInternal(pagediv, m, pagehidden, partialupdate) {
        // TODO: standard declared updates

        // show variations

        for (var vn in settings.variations) {
            var vc = settings.variations[vn];
            if (!vc) {
                continue;
            }
            var vd = $("#" + vn, pagediv);
            if (vd.length != 1) {
                continue;
            }
            var visibleVariationUpdated = false;
            if (!vc.condition || vc.condition(m)) {
                $(".pagevariation", pagediv).removeClass("active");
                vd.addClass("active");
                if (!visibleVariationUpdated && vc.update) {
                    vc.update(page, vd, m);
                }
                visibleVariationUpdated = true;
                break;
            }
        }

        // autopopulate

        $("[data-role='autopopulate']", pagediv).each(function() {
            // simple properties can be handled declaratively
            var element = $(this);

            // skip items that are not immediate children of the subview - i.e. they have
            // no viewTemplate ancestor and the closest view ancestor is this subview
            var viewTemplateAncestor = $(this).closest("[data-role=viewTemplate]");
            var viewAncestor = $(this).closest("[data-role=view],[data-role=page],[data-role=dialog]");
            if (viewTemplateAncestor.length > 0) return;
            if (viewAncestor[0] != pagediv) return;

            var propName = $(this).attr("data-property");
            var val = m[propName];
            element.html(val);

        });
        // autoedit

        $("[data-role='autoedit']", pagediv).each(function() {
            // simple properties can be handled declaratively
            var element = $(this);

            // skip items that are not immediate children of the subview - i.e. they have
            // no viewTemplate ancestor and the closest view ancestor is this subview
            var viewTemplateAncestor = $(this).closest("[data-role=viewTemplate]");
            var viewAncestor = $(this).closest("[data-role=view],[data-role=page],[data-role=dialog]");
            if (viewTemplateAncestor.length > 0) return;
            if (viewAncestor[0] != pagediv) return;

            var propName = $(this).attr("data-property");
            var val = m[propName];
            console.log("value " + val);


            element.val(val);

        });
        if (!pagehidden) {
            // show directional navigation indicators if necessary
            // since the indicators are global, this should only run when the page is actually visible.
            showDirectionalNav.call(page, pagediv, m);
        }

        settings.customViewUpdate.call(page, pagediv, m, pagehidden, partialupdate);
    }


    this.updateView = function(pagediv, m, pagehidden, partialupdate) {
        if (!m) {
            page.getViewModel.call(page, function(m) {
                updateViewInternal(pagediv, m, pagehidden, partialupdate)
            }, pagehidden, partialupdate);
        } else {
            updateViewInternal(pagediv, m, pagehidden, partialupdate)
        }
    }
    return this;
}

