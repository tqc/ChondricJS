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

        // disable default scrolling
        if(!settings.enableScroll) {
            $(function() {
                $("body")[0].ontouchmove = function(event) {
                    event.preventDefault();
                    return false;
                };
            });
        }

        $('div[data-role="page"], div[data-role="dialog"]').live('pagecreate', PageCreated);

        $('div[data-role="dialog"]').live('pagebeforeshow', function(e, ui) {
            ui.prevPage.addClass("ui-dialog-background ");
            ui.prevPage.one("pageremove", function(e) {e.preventDefault();})
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
        $.mobile.initializePage();

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


    this.init = function(callback) {
        // load required scripts
        console.log("beginning app initialization");
        var initInternal = function() {
                console.log("begin internal init");
                //  alert("running init")
                loadScripts(0, function() {
                    console.log("loaded scripts");


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
                                    complete(function() {
                                        if(callback) callback();
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
};



