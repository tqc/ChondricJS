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

    load: function() {
        var view = this;

        // todo: load via ajax
        var viewurl = view.templateFile + "?nocache=" + app.startTime;

        $.get(viewurl, null, function(data) {
            var html = $(data);
            var pe = $(".page", html);

            var content = "";

            if (html.length == 0) {
                content = "Error - Invalid page template";
            } else if (html.hasClass("page")) {
                content = html.html();
            } else if (pe.length >= 1) {
                content = pe.html();
            } else {
                content = data
            }

            view.element.html(content);
            if (view.useAngular) {
                console.log("Init angular");

                view.angularModule = angular.module("page_" + view.id, []);

                view.initAngular();

                for (var k in view.controllers) {
                    view.angularModule.controller(k, view.controllers[k]);
                }
                angular.bootstrap(view.element[0], ["page_" + view.id].concat(view.angularModules || []));



            }


            view.updateViewBackground();
            view.attachEvents();
        })



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

        if (view.element && view.element.hasClass(pageclass)) {
            // page already exists and is positioned correctly - eg during next/prev swipe
            return callback();
        }


        var ind = view.id.indexOf("_");
        var templateId = view.id.substr(0, ind) || view.id;

        var safeId = view.id.replace(/\/\.\|/g, "_");

        view.ensureDataLoaded(function() {

            view.element = $("#" + safeId);

            if (view.element.length == 0) {
                // page not loaded - create it
                $(".viewport").append("<div class=\"page " + templateId + " notransition " + pageclass + "\" id=\"" + safeId + "\">Not loaded</div>");
                view.element = $("#" + safeId);
                view.element.append("<div class=\"content\"></div>");
                view.element.append("<div class=\"loadingOverlay\"></div>");

                view.load();
            }


            // todo: add loading overlay if not already present

            $(".page." + pageclass).removeClass("pageclass");
            view.element.attr("class", "page " + templateId + " notransition " + pageclass);

            if (view.swipe) view.element.addClass("swipe");
            if (view.swipeToBlank) view.element.addClass("swipetoblank");


            window.setTimeout(function() {
                view.element.removeClass("notransition");
                callback();
            }, 0);

        });

    },

    // todo: these don't really belong here
    showNextPage: function() {
        if (!this.next) return;
        app.transition(this.next, "next", "prev");
    },
    showPreviousPage: function() {
        if (!this.prev) return;
        app.transition(this.prev, "prev", "next");
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