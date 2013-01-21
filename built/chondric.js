// jqm autoinit doesn't work for dynamic pages
$(document).bind("mobileinit", function() {
    $.mobile.autoInitializePage = false;

});

Chondric = {};

Chondric.App = function(options) {
    var app = this;
    this.ready = false;
    this.autohidesplashscreen = false;
    this.Pages = {};
    this.Actions = {};

app.Views = {};
app.ViewTemplates = {};


app.createViewTemplate = function(baseView, viewName, templateFile, functions) {
    
var template = function(options) {
    var settings = {
            template: templateFile
    };
    $.extend(settings, options)
    baseView.call(this, settings);
}
$.extend(template.prototype, baseView.prototype, functions);

app.ViewTemplates[viewName] = template;

};

app.createViewTemplate(
    Chondric.View,
    "AppLoadTemplate",
    "index.html",
    {
            getDefaultModel: function() {
        return {};
    },
    updateModel: function(dataId, existingData, callback) {
        if (!this.model) this.model = this.getDefaultModel();
        var m = this.model;

       
        callback();
    },
    updateView: function() {
        
    },
    attachSubviews: function() {
        var page = this;
      

    }

    })

app.Views.appLoadPage = new app.ViewTemplates.AppLoadTemplate({ id: "appLoadPage"});

app.activeView = app.Views.appLoadPage;


    app.platform = "web";
    app.isSimulator = false;

    function getByProp(arr, prop, val) {
        for(var i = 0; i < arr.length; i++) {
            if(arr[i][prop] == val) return arr[i];
        }
    }

    var settings = {
        name: "Base App",
        mightBePhoneGap: true,
        scriptGroups: [],
        contexts: {},
        enableScroll: true,
        getDatabase: null,
        loadData: function(loadedctx, callback) {
            callback()
        },
        customInit: function(callback) {
            callback()
        },
        debugMode: false
    };

    $.extend(settings, options);
    app.debugMode = settings.debugMode;

    function loadScripts(scriptGroupNum, callback) {
        console.log("starting loadscripts");
        if(scriptGroupNum >= settings.scriptGroups.length) {
            return callback();
        }
        console.log("calling require");
        require(settings.scriptGroups[scriptGroupNum], function() {
            loadScripts(scriptGroupNum + 1, callback)
        });
    }

    function initData(callback) {
        console.log("getting database");

        app.db = settings.getDatabase();
        if(!app.db) {
            callback();
        } else {
            app.db.updateDatabase(function() {

                callback();
            })
        }
    }


    app.context = {};
    app.contextValues = {};
    app.contextValueStrings = {};

    // set up context functions
    for(var cn0 in settings.contexts) {
        function newscope(cn1) {
            var cn = cn1;
            var ctx = settings.contexts[cn];
            app.context[cn] = function(val, ctxcallback) {
                // when called with no parameters, return the value
                if(val === undefined && !ctxcallback) return app.contextValues[cn];

                // if a string is provided, set the context
                if(typeof(val) == "string") {
                    if(!app.contextValueStrings[cn] || val != app.contextValueStrings[cn]) {
                        // value is changed
                        app.contextValueStrings[cn] = val;
                        if(ctx.getValueFromString) {
                            app.contextValues[cn] = ctx.getValueFromString(val);
                        } else {
                            app.contextValues[cn] = val;
                        }
                        if(ctx.childContexts) {
                            for(var i = 0; i < ctx.childContexts.length; i++) {
                                app.context[ctx.childContexts[i]]("");
                            }
                        }
                        // TODO: if not in initial load, save context to localstorage here.
                    }

                    localStorage["appcontext_" + settings.name] = JSON.stringify(app.contextValueStrings);
                }

                if(ctxcallback) ctxcallback(app.contextValues[cn])
            }
        }

        newscope(cn0);
    }

    function attachEvents(callback) {
/*
        // disable default scrolling
        if(!settings.enableScroll) {
            $(function() {
                $("body")[0].ontouchmove = function(event) {
                    event.preventDefault();
                    return false;
                };
            });
        }
*/
        $('div[data-role="page"], div[data-role="dialog"]').live('pagecreate', PageCreated);

        $('div[data-role="dialog"]').live('pagebeforeshow', function(e, ui) {
            ui.prevPage.addClass("ui-dialog-background ");
            ui.prevPage.one("pageremove", function(e) {
                e.preventDefault();
            })
        });

        $('div[data-role="dialog"]').live('pagehide', function(e, ui) {
            $(".ui-dialog-background").removeClass("ui-dialog-background ");
        });



        $('a[href]').live('vclick', ButtonClick);

        $('div[data-role="page"], div[data-role="dialog"]').live('pagebeforeshow', PageBeforeShow);
        $('div[data-role="page"], div[data-role="dialog"]').live('pageshow', PageShown);

        $('a[data-iconpos="notext"]').live('taphold', function(event) {
            //alert("taphold");
            event.preventDefault();
            return false;
        });

        $('input, textarea').live('focus', function(event) {
            // disable horizontal scrolling when showing onscreen keyboard
            window.scrollTo(0, window.scrollY);
        });
        callback();
    }

    function complete(callback) {
        if(app.debugMode) {
            $("body").addClass("debugmode");
        }
        $("#startPage").attr("data-url", document.location.pathname.replace(/\/$/, "/index.html"));
        //        $.mobile.initializePage();
        app.autohidesplashscreen && navigator && navigator.splashscreen && navigator.splashscreen.hide();

        app.ready = true;
        callback();
    }

    function isScriptless(pagediv) {
        return $(pagediv).attr("data-scriptless") != undefined;
    }

    function PageCreated(event) {
        var pageid = this.id;
        var pagediv = this;



        console.log("created page " + pageid);
        //    $(pagediv).attr("style", "")
        if(isScriptless(pagediv)) {

            // TODO: allow this on scripted dialogs with data-autoclose attribute
            // scriptless dialogs can be closed by clicking outside
            // TODO: should this be vclick?
            if($(pagediv).attr("data-role") == "dialog") {
                $(pagediv).click(function() {
                    $('.ui-dialog').dialog('close');
                });
                $("[data-role=content], [data-role=header]", pagediv).click(function(e) {
                    e.stopPropagation();
                });
            }

            return;

        }

        // TODO: this probably goes better elsewhere
        // converts a link with data-role help to a standard popup button
        $("[data-role='help']", pagediv).each(function() {
            // simple properties can be handled declaratively
            var element = $(this);
            element.html("Help");
            element.attr("data-role", "button");
            element.attr("data-icon", "info");
            element.attr("data-iconpos", "notext");
            element.attr("data-inline", "true");
            element.attr("data-transition", "pop");
            element.attr("data-rel", "dialog");

        });
        // ensure page script is loaded and call setup method of page
        if(app.Pages[pageid]) {
            app.Pages[pageid].attachEvents.call(app.Pages[pageid], pagediv);
            app.Pages[pageid].updateView.call(app.Pages[pageid], pagediv, null, true, true);
        } else {
            require(["pages/" + pageid.toLowerCase().replace(/page$/, "") + ".js"], function() {
                app.Pages[pageid].attachEvents.call(app.Pages[pageid], pagediv);
                app.Pages[pageid].updateView.call(app.Pages[pageid], pagediv, null, true, true);
            });
        }

    };

    function PageBeforeShow(event) {

        var pagediv = this;
        var pageid = this.id;

        console.log("shown page " + pageid);
        console.log("data-url = " + $(pagediv).attr("data-url"));


        //  $(pagediv).attr("style", "")
        if(isScriptless(pagediv)) return;

        if(app.Pages[pageid]) {
            app.Pages[pageid].updateView.call(app.Pages[pageid], pagediv, null, true, false);
        } else {
            require(["pages/" + pageid.toLowerCase().replace(/page$/, "") + ".js"], function() {
                app.Pages[pageid].updateView.call(app.Pages[pageid], pagediv, null, true, false);
            });
        }
    };

    function PageShown(event) {

        var pagediv = this;
        var pageid = this.id;

        console.log("shown page " + pageid);
        console.log("data-url = " + $(pagediv).attr("data-url"));


        //      $(pagediv).attr("style", "")
        if(isScriptless(pagediv)) return;

        if(app.Pages[pageid]) {
            app.Pages[pageid].updateView.call(app.Pages[pageid], pagediv, null, false, false);
        } else {
            require(["pages/" + pageid.toLowerCase().replace(/page$/, "") + ".js"], function() {
                app.Pages[pageid].updateView.call(app.Pages[pageid], pagediv, null, false, false);
            });
        }

    };


    function ButtonClick(event) {
        //alert("vclick");
        var link = $(this);

        if(link.attr("data-animate-click") && app.animateClick) {
            app.animateClick(link);

        }

        var action = app.Actions[link.attr("data-action")];
        if(link.attr("data-prepopulate")) {
            app.prepopulate = JSON.parse(link.attr("data-prepopulate"));
        }
        for(var cn in settings.contexts) {

            // TODO: need a way to handle custom context like file/version
            if(link.attr("data-context-" + cn)) {
                app.context[cn](link.attr("data-context-" + cn));
            }

        }

        if(action) {
            action.execute();
        } else {
            return true;
            //var href = link.attr("href");
            //if (href) $.mobile.changePage(href, {});
        }
        return false;
    };

    this.appLoadLog = function(msg) {
        console.log(msg);
    };

    this.getView = function(viewId) {
       var view = app.Views[viewId];
       if (view) return view;
                var ind = viewId.indexOf("_");
                var templateId =  viewId.substr(0, ind) || viewId;
                view = app.Views[viewId] = new app.ViewTemplates[templateId]({
                    id: viewId
                });

                return view;

    };

    this.transition = function(nextPageId, inPageClass, outPageClass) {
        if(app.transitioning) return;
        app.transitioning = true;
        var thisPage = app.activeView;
        thisPage.ensureLoaded("active", function() {
            var nextPage = app.getView(nextPageId);
            thisPage.deactivating(nextPage);
            nextPage.ensureLoaded(inPageClass, function() {

                thisPage.element.one("webkitTransitionEnd", function() {
                    nextPage.activated();
                    app.transitioning = false;
                    $(".page.next").removeClass("next");
                    $(".page.prev").removeClass("prev");
                    if(nextPage.next) app.getView(nextPage.next).ensureLoaded("next", function() {});
                    if(nextPage.prev) app.getView(nextPage.prev).ensureLoaded("prev", function() {});


                });

                thisPage.element[0].style.webkitTransform = null;
                nextPage.element[0].style.webkitTransform = null;

                thisPage.element.addClass(outPageClass).removeClass("active");
                nextPage.element.addClass("active").removeClass(inPageClass);


                app.activeView = nextPage;


            });



        });


    }

    var initEvents = function(callback) {


            app.appLoadLog("Setting up event handlers");



            var nextPage = app.activeView;
            nextPage.ensureLoaded("active", function() {});
            if(nextPage.next) app.Views[nextPage.next].ensureLoaded("next", function() {});
            if(nextPage.prev) app.Views[nextPage.prev].ensureLoaded("prev", function() {});



            var swiping = false;

            var startX = 0;
            var startY = 0;
            var dx = 0;
            var dy = 0;

            var activePage;
            var nextPage;
            var prevPage;

            var viewportWidth;

            $(document).on("mousedown touchstart", ".page", function(e) {
//                alert("1");
                swiping = true;


                if (e.originalEvent.changedTouches) {
                                    startX = e.originalEvent.changedTouches[0].clientX;
                startY = e.originalEvent.changedTouches[0].clientY;

                }
                else {
                startX = e.clientX;
                startY = e.clientY;
                dx =0;
                dy =0;
}
                activePage = $(".page.active");
                nextPage = $(".page.next");
                prevPage = $(".page.prev");

                viewportWidth = $(".viewport").width();


            });
            $(document).on("mousemove touchmove", ".page.active", function(e) {
                if(app.transitioning) return;
                if(!swiping) return;

                if (e.originalEvent.changedTouches) {
                 dx = e.originalEvent.changedTouches[0].clientX - startX;
                dy = e.originalEvent.changedTouches[0].clientY - startY;
}
else {

                dx = e.clientX - startX;
                dy = e.clientY - startY;
            }
                if (dy > 20 || dy < -20) {
                    dx = 0;
                                    activePage[0].style.webkitTransitionDuration = 0;
                activePage[0].style.webkitTransform = "translateX(" + (dx) + "px)";

                }
                else {


                activePage[0].style.webkitTransitionDuration = 0;
                activePage[0].style.webkitTransform = "translateX(" + (dx) + "px)";
                if(nextPage[0]) nextPage[0].style.webkitTransitionDuration = 0;
                if(nextPage[0]) nextPage[0].style.webkitTransform = "translateX(" + (viewportWidth + 10 + dx) + "px)";
                if(prevPage[0]) prevPage[0].style.webkitTransitionDuration = 0;
                if(prevPage[0]) prevPage[0].style.webkitTransform = "translateX(" + (-viewportWidth - 10 + dx) + "px)";
                return false;
                
                }

             //   e.stopPropagation();
//                return false;

            });
            $(document).on("mouseup touchend", ".page", function(e) {

                activePage[0].style.webkitTransitionDuration = null;
                if(nextPage[0]) nextPage[0].style.webkitTransitionDuration = null;
                if(prevPage[0]) prevPage[0].style.webkitTransitionDuration = null;

                //  activePage[0].style.webkitTransform = null;
                //  nextPage[0].style.webkitTransform = null;
                //  prevPage[0].style.webkitTransform = null;

                $(".page.active .page.next .page.prev").attr("style", "");

                swiping = false;
                if(dx < -100 && app.activeView.next) app.activeView.showNextPage();
                else if(dx > 100 && app.activeView.prev) app.activeView.showPreviousPage();
                else {
                    activePage[0].style.webkitTransform = null;
                    if(nextPage[0]) nextPage[0].style.webkitTransform = null;
                    if(prevPage[0]) prevPage[0].style.webkitTransform = null;



                }


            });


            $(document).on("tap click", "a.pop", function() {
                var link = $(this);
                var id = link.attr("href").replace("#", "");

                app.transition(id, "behindsmall", "behindfull");


                return false;

            })


            $(document).on("tap click", "a.close", function() {
                var link = $(this);
                var id = link.attr("href").replace("#", "");

                app.transition(id, "behindfull", "behindsmall");


                return false;

            })

            $(document).on("tap click", "a.next", function() {
                var link = $(this);
                var id = link.attr("href").replace("#", "");
                if (id == "next") id = app.activeView.next;

                app.transition(id, "next", "prev");


                return false;

            })


            $(document).on("tap click", "a.prev", function() {
                var link = $(this);
                var id = link.attr("href").replace("#", "");
                if (id == "prev") id = app.activeView.prev;

                app.transition(id, "prev", "next");


                return false;

            })



            callback();
        };

    var loadFirstPage = function(callback) {
            var vid = settings.firstPageTemplate+"_"+settings.firstPageDataId;
            if (vid.indexOf("_") == vid.length-1) vid = settings.firstPageTemplate;
           
app.transition(vid, "behindsmall", "behindfull");

            callback();
   
        };

    this.init = function(callback) {
        // load required scripts
        console.log("beginning app initialization");

        var initInternal = function() {
                console.log("begin internal init");
                //  alert("running init")
                loadScripts(0, function() {
                    console.log("loaded scripts");
                    initEvents(function() {


                        // create database
                        initData(function() {
                            console.log("loading context");

                            var loadedctx = JSON.parse(localStorage["appcontext_" + settings.name] || "{}");
                            //load data
                            settings.loadData.call(app, loadedctx, function() {
                                // attach common events
                                attachEvents(function() {
                                    // custom init function
                                    settings.customInit.call(app, function() {
                                        // hide splash screen and show page
                                        loadFirstPage(function() {

                                            complete(function() {
                                                if(callback) callback();
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            };

        if(window.WinJS) {
            app.platform = "windows"
            $(initInternal);
        } else if(settings.mightBePhoneGap && document.location.protocol == "file:") {
            // file protocol indicates phonegap
            app.isPhonegap = true;
            app.platform = "cordova";
            document.addEventListener("deviceready", function() {
                console.log("appframework deviceready");
                console.log(device.platform);
                app.isSimulator = device.platform.indexOf("Simulator") > 0;
                $(initInternal);
            }

            , false);
        } else {
            // no phonegap - web preview mode
            app.platform = "web"

            $(initInternal);
        }

    }
    return this;
};;;

Chondric.View = function(options) {
    var settings = {
        id: null,
        element: null,  
        init: function() {}    
    };  

    $.extend(settings, options);

    if (!settings.template) settings.template = settings.id + ".html";
    this.copyValues(settings);
    this.init(settings);
}
$.extend(Chondric.View.prototype, {
    updateViewBackground: function() {

    },
    attachEvents: function() {
          console.log("no events to attach");
    },
      renderThumbnail: function(el) {
    },
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
    copyValues: function (options) {
        this.id = options.id;
        this.template = options.template;
        this.next = options.next;
        this.prev = options.prev;
        this.element = options.element;
    },
    init: function(options) {
        console.log ("init view - "+options.testOption);
        options.init();
    },
    templateLoaded: function() {},
    activated: function() {
        console.log("activated");
    },
    deactivating: function(nextPage) {
        console.log("deactivating");
    },

load: function() {
var view = this;

// todo: load via ajax

$.get(view.template, null, function(data) {
var html = $(data);
var pe = $(".page", html);

var content = "";

if (html.length == 0) {
content = "Error - Invalid page template";
}
else if (html.hasClass("page")) {
    content = html.html();
}
else if (pe.length >= 1) {
content = pe.html();
}
else {
    content = data
}

view.element.html(content);
view.updateViewBackground();
view.attachEvents();
})



},
ensureDataLoaded: function(callback) {
var view = this;
if (!view.model) {
     var ind = view.id.indexOf("_");
     var templateId =  view.id.substr(0, ind) || view.id;
     var dataId =  view.id.substr(templateId.length+1);

    view.updateModel(dataId, null, callback);
    }
    else {
        callback();
    }
},

ensureLoaded: function(pageclass, callback) {
var view = this;

                var ind = view.id.indexOf("_");
                var templateId =  view.id.substr(0, ind) || view.id;
view.ensureDataLoaded(function() {

view.element = $("#"+view.id);

if (view.element.length == 0) {
// page not loaded - create it

$(".viewport").append("<div class=\"page "+templateId+" notransition "+pageclass+"\" id=\""+view.id+"\">Not loaded</div>");
view.element = $("#"+view.id);
view.element.append("<div class=\"content\"></div>");
view.element.append("<div class=\"loadingOverlay\"></div>");

view.load();
}


// todo: add loading overlay if not already present


$(".page."+pageclass).removeClass("pageclass");
view.element.attr("class", "page "+templateId+" notransition "+pageclass);
window.setTimeout(function() {view.element.removeClass("notransition");
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
$.extend(Chondric.SampleSubviewTemplate.prototype, Chondric.View.prototype, 
{
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
$.extend(Chondric.SampleViewTemplate.prototype, Chondric.View.prototype, 
{
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
            id: page.id+"_subview1",
            element: $(".subview", page.element)
        });

    }
});




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
                        var domElements = $(">[data-role=view]", container);
                        var domIndex = 0;
                        var keyIndex = 0;

                        var sortedKeys = {};
                        while (keyIndex < orderedKeys.length && domIndex < domElements.length) {                             
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
                             domElements = $(">[data-role=view]", container);
                        }
                    }


                    return this;
                };
            })(jQuery);;;

Chondric.VersionedDatabase = function(db, updatefunctions, tables) {

    this.sqlerror = function(t, err) {
        if (err && err.message) console.error(err.message);
        else if (t && t.message) console.error(t.message);
        else if (err) {
            console.error(err);
        } else if (t) {
            console.error(t);
        } else {
            console.log("sql error");
        }
    };
    var sqlerror = this.sqlerror;

        var getVersion = function(versionCallback) {
            console.log("checking version")

            db.transaction(function(tx) {
                tx.executeSql("SELECT * FROM settings where key=?", ["dbVersion"], function(t, result) {
                    if (result.rows.length == 0) return versionCallback(0);
                    var row = result.rows[0] || result.rows.item(0)
                    window.setTimeout(function() {return versionCallback(parseFloat(row["val"]));}, 0);
                }, function() {
                    // error - no db
                    window.setTimeout(function() {versionCallback(0);}, 0);
                });
            }, function() {
                    // error - no db
                    window.setTimeout(function() {versionCallback(0);}, 0);
                });
        }

    this.updateDatabase = function(callback) {



        getVersion(function(currentVersion) {
            console.log("Current database version is " + currentVersion)

            var existingversion = currentVersion;

              var versionQueue = [];

            for(vn in updatefunctions) {
                var vv = parseFloat(vn);
                if(existingversion < vv) {
                    versionQueue.push(vn);
                }
            }
 
            if (versionQueue.length == 0) return callback();

            db.transaction(function(tx) {
                for (vn in updatefunctions) {
                    var vv = parseFloat(vn);
                    if (existingversion < vv) {
                        updatefunctions[vn](tx);
                        tx.executeSql('INSERT OR REPLACE INTO settings (key, val) VALUES (?, ?)', ["dbVersion", vv], function() {}, sqlerror);
                        existingversion = vv;
                    }
                }
            }, sqlerror, function() {
                callback();
            });
        });
    }


    this.dropDatabase = function(callback) {
        db.transaction(function(tx) {
            for (tn in tables) {
                tx.executeSql("DROP TABLE " + tn, [], null, sqlerror);
            }
        }, sqlerror, function() {
            callback();
        });
    }

    this.resetDatabase = function(callback) {
        var that = this;
        this.dropDatabase(function() {
            that.updateDatabase(callback);
        });
    }

}
