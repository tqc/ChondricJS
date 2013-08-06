;;

Chondric.View = function(options) {
    var settings = {
        id: null,
        element: null,
        swipe: true,
        swipeToBlank: false
    };

    $.extend(settings, options);

    this.settings = settings;

    for (var k in settings) {
        this[k] = settings[k];
    }
    //$.extend(this, settings);
    this.initInternal(settings);
}
$.extend(Chondric.View.prototype, {
    // obsolete - should use updateView instead
    updateViewBackground: function() {
        this.updateView();
    },
    updateView: function() {

    },
    attachEvents: function() {
        console.log("no events to attach");
    },
    renderThumbnail: function(el) {},
    getDefaultModel: function() {
        return {};
    },
    updateModel: function(dataId, existingData, callback) {
        if (!this.model) this.model = this.getDefaultModel();
        var m = this.model;


        callback();
    },

    // called to update the view with new data - eg download status
    // may do nothing if the view is not loaded.
    // if the view is loaded but not visible, the model is updated so that the change 
    // can be applied when the view is shown.
    updateData: function(d) {

    },
    init: function(options) {
        //  console.log("init view - " + options.testOption);
        // default implementation
    },
    initAngular: function() {},
    initInternal: function(options) {
        console.log("init view - " + options.testOption);
        this.init(options);
    },
    templateLoaded: function() {
        console.log("template loaded");
    },
    activating: function() {
        console.log("activating");
    },
    activated: function() {
        console.log("activated");
    },
    deactivating: function(nextPage) {
        console.log("deactivating");
    },

    setSwipePosition: function(prevPageElement, nextPageElement, dx, duration) {
        //        console.log("default: "+dx);
        var thisPage = this;
        if (duration !== undefined) {
            thisPage.element[0].style.webkitTransitionDuration = duration;
            if (nextPageElement && nextPageElement[0]) nextPageElement[0].style.webkitTransitionDuration = duration;
            if (prevPageElement && prevPageElement[0]) prevPageElement[0].style.webkitTransitionDuration = duration;

        }

        if (dx === null) {
            thisPage.element[0].style.webkitTransform = null;
            if (nextPageElement && nextPageElement[0]) nextPageElement[0].style.webkitTransform = null;
            if (prevPageElement && prevPageElement[0]) prevPageElement[0].style.webkitTransform = null;

        } else if (dx !== undefined) {
            if (prevPageElement) prevPageElement.addClass("prev");
            if (nextPageElement) nextPageElement.addClass("next");

            thisPage.element[0].style.webkitTransform = "translateX(" + (dx) + "px)";
            if (nextPageElement && nextPageElement[0] && dx < 0) {

                nextPageElement[0].style.webkitTransform = "translateX(" + (app.viewportWidth + 10 + dx) + "px)";

            }
            if (prevPageElement && prevPageElement[0] && dx > 0) {

                prevPageElement[0].style.webkitTransform = "translateX(" + (-app.viewportWidth - 10 + dx) + "px)";

            }

        }
    },

    load: function() {
        var view = this;

        // todo: load via ajax
        var viewurl = view.templateFile + "?nocache=" + app.startTime;

        $.get(viewurl, null, function(data) {
            var html = $(data);
            var pe = $(".page", html);

            var content = "";

            if (html.length === 0) {
                content = "Error - Invalid page template";
            } else if (html.hasClass("page")) {
                content = html.html();
            } else if (pe.length >= 1) {
                content = pe.html();
            } else {
                content = data;
            }

            view.element.html(content);
            if (view.useAngular) {
                var ctrl = pe.attr("ng-controller") || html.attr("ng-controller");
                if (ctrl) view.element.attr("ng-controller", ctrl);

                console.log("Init angular");

                view.angularModule = angular.module("page_" + view.id, []);

                view.initAngular();

                for (var k in view.controllers) {
                    view.angularModule.controller(k, view.controllers[k]);
                }
                angular.bootstrap(view.element[0], ["page_" + view.id, "chondric"].concat(app.angularModules || [], view.angularModules || []));



            }


            view.updateViewBackground();
            view.attachEvents();
            view.loading = false;
            view.element.removeClass("loading");
        });



    },
    ensureDataLoaded: function(callback) {
        var view = this;
        if (!view.model) {
            var ind = view.id.indexOf("_");
            var templateId = view.id.substr(0, ind) || view.id;
            var dataId = view.id.substr(templateId.length + 1);

            view.updateModel(dataId, null, callback);

        } else {
            callback();
        }
    },

    ensureLoaded: function(pageclass, callback) {
        var view = this;

        if (view.element && (!pageclass || view.element.attr("class") == "page " + templateId + " " + pageclass)) {
            // page already exists and is positioned correctly - eg during next/prev swipe
            return callback();
        }


        var ind = view.id.indexOf("_");
        var templateId = view.id.substr(0, ind) || view.id;

        var safeId = view.id.replace(/\/\.\|/g, "_");

        view.ensureDataLoaded(function() {

            view.element = $("#" + safeId);

            if (view.element.length == 0) {
                view.loading = true;
                // page not loaded - create it
                $(".viewport").append("<div class=\"page " + templateId + " notransition loading " + pageclass + "\" id=\"" + safeId + "\"></div>");
                view.element = $("#" + safeId);
                view.element.append("<div class=\"content\"></div>");
                view.element.append("<div class=\"loadingOverlay\"><a href=\"javascript:window.location.reload()\">Reload</a></div>");

                view.load();
            }

            if (pageclass) {
                // remove pageclass from any other pages
                $(".page." + pageclass).each(function() {
                    if (this != view.element[0]) $(this).removeClass(pageclass);
                });
                view.element.attr("class", "page " + templateId + " notransition " + pageclass);
            }
            if (view.swipe) view.element.addClass("swipe");
            if (view.swipeToBlank) view.element.addClass("swipetoblank");
            if (view.loading) view.element.addClass("loading");


            window.setTimeout(function() {
                view.element.removeClass("notransition");
                window.setTimeout(function() {
                    callback();
                }, 0);
            }, 0);

        });

    },

    showNextPage: function() {
        if (!this.next) return;
        app.changePage(this.next, "next");
    },
    showPreviousPage: function() {
        if (!this.prev) return;
        app.changePage(this.prev, "prev");
    }

});


Chondric.SampleSubviewTemplate = function(options) {
    var settings = {
        template: "subview.html"
    };
    $.extend(settings, options)
    Chondric.View.call(this, settings);
}
$.extend(Chondric.SampleSubviewTemplate.prototype, Chondric.View.prototype, {
    getDefaultModel: function() {
        return {};
    },
    updateModel: function(dataId, callback) {
        if (!this.model) this.model = this.getDefaultModel();
        var m = this.model;

        callback();
    },
    updateView: function() {
        // update elements directly
    }
});



Chondric.SampleViewTemplate = function(options) {
    var settings = {
        template: "index.html"
    };
    $.extend(settings, options)
    Chondric.View.call(this, settings);
}
$.extend(Chondric.SampleViewTemplate.prototype, Chondric.View.prototype, {
    getDefaultModel: function() {
        return {};
    },
    updateModel: function(dataId, callback) {
        if (!this.model) this.model = this.getDefaultModel();
        var m = this.model;

        this.subViews["firstSubView"].setModel(m.subviewmodel);
        callback();
    },
    updateView: function() {
        this.subViews["firstSubView"].updateView();
    },
    attachSubviews: function() {
        var page = this;
        this.subViews["firstSubView"] = new Chondric.SampleSubviewTemplate({
            id: page.id + "_subview1",
            element: $(".subview", page.element)
        });

    }
});