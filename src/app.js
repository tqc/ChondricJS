// ie doesn't like console.log

if (!window.console) {
    window.console = {
        log: function() {},
        error: alert
    };
}

var Chondric = angular.module('chondric', [])

Chondric.App =
    Chondric.initApp = function(options) {
        var app = {};
        var appModule = app.module = angular.module(options.name || "appModule", ['chondric'].concat(options.angularModules || []));

        var allRoutes = app.allRoutes = {}


        // these options are defined in the
        var initialOptions = {

        }



        app.createViewTemplate = function(baseView, templateId, templateFile, viewOptions) {

            if (typeof templateId == "string") {
                // old format
                viewOptions.baseView = baseView;
                viewOptions.templateId = templateId;
                viewOptions.templateFile = templateFile;
            } else {
                viewOptions = baseView;
            }

            var allControllers = [];
            var page = {};
            if (viewOptions.initAngular) viewOptions.initAngular.call(page);
            var pageController = null;
            if (viewOptions.controller) {
                // use this controller with name based on id or random
                pageController = viewOptions.controller;
            }
            for (var cn in page.controllers) {
                if (!pageController) {
                    pageController = page.controllers[cn];
                    continue;
                };
                // todo: register other controllers
            }

            var route = viewOptions.route || ("/" + viewOptions.templateId + "/$p1/$p2");
            var templateUrl = viewOptions.templateId + ".html";
            if (viewOptions.templateFolder) templateUrl = viewOptions.templateFolder + "/" + templateUrl;
            allRoutes[route] = {
                isSection: false,
                controller: pageController,
                templateUrl: templateUrl,
                templateId: viewOptions.templateId,
            }
        }

        app.createSection = function(viewOptions) {
            var pageController = null;
            if (viewOptions.controller) {
                // use this controller with name based on id or random
                pageController = viewOptions.controller;
            }

            for (var cn in viewOptions.controllers || {}) {
                if (!pageController) {
                    pageController = page.controllers[cn];
                    continue;
                };
                // todo: register other controllers
            }

            var route = viewOptions.route;

            allRoutes[route] = {
                isSection: true,
                controller: pageController,
                //            templateUrl: viewOptions.templateUrl,
                //            templateId: viewOptions.templateId,
            }
        }




        var appCtrl = app.controller = function($scope) {
            app.scope = $scope;
            $scope.allRoutes = allRoutes;
            $scope.route = null;
            $scope.nextRoute = null;
            $scope.lastRoute = null;
            $scope.transition = "crossfade";

            $scope.openViews = {}

            function loadView(url) {
                if (!url) {
                    // first run - load start page
                    console.log("default route")
                    return;
                }
                var matchingRoutes = [];
                var parts = url.split("/");
                routeLoop: for (var r in allRoutes) {
                    var rparts = r.split("/");
                    for (var i = 0; i < rparts.length; i++) {
                        if (rparts[i] == parts[i]) continue;
                        if (rparts[i][0] == "$") continue;
                        continue routeLoop;
                    }
                    matchingRoutes.push(r);
                }
                matchingRoutes.sort(function(a, b) {
                    return a.length - b.length
                })

                // matching routes list should be section heirarchy

                var openViews = $scope.openViews;
                for (var i = 0; i < matchingRoutes.length; i++) {
                    var template = $scope.allRoutes[matchingRoutes[i]];
                    var mrp = matchingRoutes[i].split("/");
                    var ar = "";
                    var params = {};
                    for (var j = 0; j < mrp.length; j++) {
                        if (mrp[j][0] == "$") params[mrp[j].substr(1)] = decodeURIComponent(parts[j]);
                        if (parts[j]) ar += "/" + parts[j];
                    }
                    console.log(params);
                    if (template.isSection) {
                        console.log("Get section with route " + ar);
                        var section = openViews[ar];
                        if (!section) {
                            section = openViews[ar] = {
                                controller: template.controller,
                                isSection: true,
                                params: params,
                                subsections: {}
                            }
                        }
                        openViews = section.subsections;
                    } else {
                        console.log("Get page with route " + ar);
                        var page = openViews[ar];
                        if (!page) {
                            page = openViews[ar] = {
                                controller: template.controller,
                                templateUrl: template.templateUrl,
                                templateId: template.templateId,
                                params: params
                            }
                        }
                        return;
                    }
                }
            }

            $scope.changePage = app.changePage = function(r, transition) {
                if (!r || r.indexOf("/") < 0) {
                    console.error("changePage syntax has changed - the first parameter is a route url instead of an id");
                    return;
                }
                if ($scope.route == r) return;
                if ($scope.lastRoute == r) $scope.lastRoute = null;
                $scope.transition = transition || "crossfade";
                $scope.noTransition = true;
                loadView(r);
                $scope.nextRoute = r;
                window.setTimeout(function() {
                    $scope.noTransition = false;
                    $scope.route = r;
                    $scope.$apply();
                }, 100)

            }

            $scope.$watch("route", function(url, oldVal) {
                $scope.nextRoute = null;
                $scope.lastRoute = oldVal;
                console.log("Route changed to " + url + " from " + oldVal);
                document.location.hash = url;
                loadView(url);
            })
            if (options.appCtrl) options.appCtrl($scope);
        } // end appCtrl




        app.ready = false;
        app.autohidesplashscreen = false;
        app.Pages = {};
        app.Actions = {};

        app.startTime = new Date().getTime();

        app.Views = {};
        app.ViewTemplates = {};

        /*
    app.createViewTemplate = function(baseView, templateId, templateFile, options) {

        if (typeof templateId == "string") {
            // old format
            options.baseView = baseView;
            options.templateId = templateId;
            options.templateFile = templateFile;
        } else {
            options = baseView;
        }

        var templateSettings = {
            templateId: options.templateId,
            templateFile: options.templateFile || (options.templateId + ".html"),
            baseView: options.baseView || Chondric.View,
        };

        if (options.initAngular || options.angularModules) {
            options.useAngular = true;
        }

        var template = function(viewoptions) {
            var settings = {};
            $.extend(settings, templateSettings, viewoptions);
            templateSettings.baseView.call(this, settings);
            this.settings = settings;
        };

        var functions = {};

        for (var k in options) {
            var v = options[k];
            if (k == "baseView") continue;
            else if (k == "templateId") continue;
            else if (k == "templateFile") continue;
            else if (k == "controller") templateSettings[k] = v;
            else if (typeof v == "function") functions[k] = v;
            else templateSettings[k] = v;
        }

        $.extend(template.prototype, templateSettings.baseView.prototype, functions);

        app.ViewTemplates[options.templateId] = template;

    };
*/
        /*
    app.createViewTemplate(
        Chondric.View,
        "AppLoadTemplate",
        "index.html", {
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

    app.Views.appLoadPage = new app.ViewTemplates.AppLoadTemplate({
        id: "appLoadPage"
    });

    app.activeView = app.Views.appLoadPage;
*/

        app.platform = "web";
        app.isSimulator = false;

        function getByProp(arr, prop, val) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i][prop] == val) return arr[i];
            }
        }

        var settings = {
            name: "Base App",
            mightBePhoneGap: true,
            loadPageFromHash: true,
            scriptGroups: [],
            angularModules: [],
            contexts: {},
            getDatabase: null,
            loadData: function(loadedctx, callback) {
                callback();
            },
            customInit: function(callback) {
                callback();
            },
            updateNotificationSettings: function(deviceId, notificationsEnabled) {
                // send details to the notification server
                console.warn("updateNotificationSettings is not implemented");
            },
            notificationReceived: function(event) {
                console.warn("notificationReceived is not implemented");
            },
            debugMode: false
        };


        $.extend(settings, options);
        app.settings = settings;
        app.debugMode = settings.debugMode;
        app.angularModules = settings.angularModules;
        app.notificationReceived = settings.notificationReceived;


        app.angularAppModule = angular.module(
            "AppModule", ["chondric"].concat(app.angularModules),
            function($controllerProvider) {
                app.controllerProvider = $controllerProvider;
            });



        function loadScripts(scriptGroupNum, callback) {
            console.log("starting loadscripts");
            if (scriptGroupNum >= settings.scriptGroups.length) {
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
            if (!app.db) {
                callback();
            } else {
                app.db.updateDatabase(function() {

                    callback();
                })
            }
        }

        function attachEvents(callback) {
            callback();
        }

        function complete(callback) {
            if (app.debugMode) {
                $("body").addClass("debugmode");
            }

            app.ready = true;
            callback();
        }

        function isScriptless(pagediv) {
            return $(pagediv).attr("data-scriptless") != undefined;
        }


        this.appLoadLog = function(msg) {
            console.log(msg);
        };

        this.getView = function(viewId) {
            var view = app.Views[viewId];
            if (view) return view;
            var ind = viewId.indexOf("_");
            var templateId = viewId.substr(0, ind) || viewId;

            if (!app.ViewTemplates[templateId]) {
                // template doesn't exist. possibly this is a scriptless page so try creating a default template
                app.createViewTemplate({
                    templateId: templateId
                });
            }

            view = app.Views[viewId] = new app.ViewTemplates[templateId]({
                id: viewId
            });



            return view;

        };


        var pageCleanupTimer = 0;
        this.pageCleanup = function() {
            var currentPage = app.activeView;
            var lastPage = app.lastPage;
            var preloads = app.activeView.preloads || [];
            if (currentPage.next) preloads.push(currentPage.next);
            if (currentPage.prev) preloads.push(currentPage.prev);

            // remove any pages not in preload list

            for (var k in app.Views) {
                if (currentPage && currentPage.id == k) continue;
                if (currentPage && currentPage.prev == k) continue;
                if (currentPage && currentPage.next == k) continue;
                if (lastPage && lastPage.id == k) continue;
                if (preloads.indexOf(k) >= 0) continue;
                var v = app.Views[k];
                if (v) {
                    v.unload();
                }
                delete app.Views[k];
            }

            // todo: load any pages in preload list that are not already loaded

            for (var i = 0; i < preloads.length; i++) {
                console.log("preload: " + preloads[i]);
                app.getView(preloads[i]).ensureLoaded(null, function() {});
            }

            pageCleanupTimer = 0;
        }

        this.queuePageCleanup = function() {
            if (!pageCleanupTimer) {
                pageCleanupTimer = window.setTimeout(app.pageCleanup, 200);
            }
        }

        this.transition = function(nextPageId, inPageClass, outPageClass) {
            /*
        if (!app.transitionClasses) {
            app.transitionClasses= {};
            for (var tn in transitions) {
                app.transitionClasses[app.transitions[tn].inPageClass] = true;
                app.transitionClasses[app.transitions[tn].outPageClass] = true;
            }
        }*/

            if (app.transitioning) {
                if (app.transitioningTo != nextPageId) {
                    // transition changed
                    // immediately complete existing transition, but do not call activated event
                    app.transitioning = false;
                    app.transitioningTo = undefined;

                } else {
                    // transition called twice - ignore
                    return;
                }
            }

            app.transitioning = true;
            app.transitioningTo = nextPageId;
            var thisPage = app.lastPage = app.activeView;
            thisPage.ensureLoaded("active", function() {
                var nextPage = app.getView(nextPageId);
                thisPage.deactivating(nextPage);

                //            $("."+inPageClass).removeClass(inPageClass);
                nextPage.ensureLoaded(inPageClass, function() {
                    window.setTimeout(function() {
                        history.pushState({}, null, "#" + nextPageId);
                        if (nextPage.loading) {
                            nextPage.isActivating = true;
                        } else {
                            nextPage.activating(thisPage);
                            if (nextPage.scope) {
                                nextPage.scope.$apply();
                            }
                        }
                    }, 0);

                    thisPage.element.one("webkitTransitionEnd", function() {
                        window.setTimeout(function() {
                            app.transitioning = false;
                            app.transitioningTo = undefined;
                            if (!app.splashScreenHidden) app.hideSplashScreen();

                            if (nextPage.loading) {
                                nextPage.isActivated = true;
                            } else {
                                nextPage.activated();
                                if (nextPage.scope) {
                                    nextPage.scope.$apply();
                                }
                            }

                            app.queuePageCleanup();
                        }, 0);
                    });


                    thisPage.setSwipePosition(null, nextPage.element, null);

                    //              $("."+outPageClass).removeClass(outPageClass);
                    thisPage.element.addClass(outPageClass).removeClass("active");
                    nextPage.element.addClass("active").removeClass(inPageClass);
                    if (outPageClass == "behinddlg") nextPage.dlgbg = thisPage.id;

                    app.activeView = nextPage;


                });



            });


        };


        this.transitions = {
            pop: {
                inPageClass: "behindsmall",
                outPageClass: "behindfull"
            },
            dlgpop: {
                inPageClass: "behindsmall",
                outPageClass: "behinddlg"
            },
            dlgclose: {
                inPageClass: "behinddlg",
                outPageClass: "behindsmall"
            },
            close: {
                inPageClass: "behindfull",
                outPageClass: "behindsmall"
            },
            prev: {
                inPageClass: "prev",
                outPageClass: "next"
            },
            next: {
                inPageClass: "next",
                outPageClass: "prev"
            },
            crossfade: {
                inPageClass: "behindfull",
                outPageClass: "behindfull"
            }
        };
        /*
    app.changePage = function(pageId, transitionId) {
        var transition = app.transitions[transitionId] || app.transitions.crossfade;
        if (pageId == "dlgbg") pageId = app.activeView.dlgbg;
        if (pageId == "prev") pageId = app.activeView.prev;
        if (pageId == "next") pageId = app.activeView.next;
        if (!pageId) return;
        app.transition(pageId, transition.inPageClass, transition.outPageClass);
    };
*/

        var initEvents = function(callback) {
            callback();
        };

        var loadFirstPage = function(callback) {
            // if first page is not specified in settings or hash, custominit is responsible for loading it

            if (app.scope.route) return callback(); // already loaded by custominit

            if (settings.loadPageFromHash && location.hash.length > 1 && location.hash.indexOf("access_token=") < 0) {
                app.changePage(location.hash.substr(1));
            } else if (settings.firstPageTemplate) {
                app.changePage(settings.firstPageTemplate, "crossfade");
            }
            callback();

        };

        app.splashScreenHidden = false;
        app.hideSplashScreen = function() {
            if (app.splashScreenHidden) return;
            if (app.platform == "cordova" && navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
            }
            app.splashScreenHidden = true;
        };

        app.registerForNotifications = function() {
            if (app.platform == "cordova" && window.plugins && window.plugins.pushNotification) {
                window.plugins.pushNotification.register(function(result) {
                    settings.updateNotificationSettings(result, true);
                }, function(error) {
                    console.error(error);
                    settings.updateNotificationSettings(null, false);
                    // alert(error);
                }, {
                    badge: "true",
                    sound: "true",
                    alert: "true",
                    ecb: "app.notificationReceived"
                });

            }
        };

        var loadHostSettings = function(callback) {

            $.ajax({
                url: "../settings.json" + location.search,
                dataType: "json",
                error: function(data) {
                    console.warn("error loading ../settings.json");
                    app.hostSettings = {};
                    callback();
                },
                success: function(data) {
                    app.hostSettings = data;
                    if (data.debug !== undefined) app.debugMode = data.debug;
                    callback();
                }
            });

            callback;
        };

        app.init = function(callback) {
            console.warn("no longer need to call app.init manually")
        };

        var init = function(callback) {
            // load required scripts
            console.log("beginning app initialization");

            var initInternal = function() {
                app.scope.platform = app.platform;
                app.scope.$apply();

                var sizeChanged = function() {
                    // on ios 7 we need to leave space for the status bar
                    // for now just check if height matches the full screen
                    var w = $(window).width();
                    var h = $(window).height();
                    console.log(w + "," + h);
                    if (h == 1024 || h == 768 || h == 320 || h == 568 || h == 480) {
                        $(".viewport").addClass("hasstatusbar");
                    } else {
                        $(".viewport").removeClass("hasstatusbar");
                    }

                    // for phone screens a multicolumn layout doesn't make sense
                    if (w < 768 && app.scope.maxColumns != 1) {
                        console.log("setting singlecolumn")
                        app.scope.maxColumns = 1;
                        $(".viewport").addClass("singlecolumn");
                        app.scope.$apply();
                    } else if (w >= 768 && app.scope.maxColumns != 3) {
                        console.log("setting multicolumn")
                        app.scope.maxColumns = 3;
                        $(".viewport").removeClass("singlecolumn");
                        app.scope.$apply();
                    }


                }
                sizeChanged();
                $(window).on("resize", sizeChanged);

                console.log("begin internal init");
                //  alert("running init")
                loadScripts(0, function() {
                    console.log("loaded scripts");
                    initEvents(function() {
                        loadHostSettings(function() {

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
                                                    if (callback) callback();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            };

            if (settings.mightBePhoneGap && document.location.protocol == "file:") {
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

        };


        app.module.run(["$rootScope", "$compile", "$controller",
            function($rootScope, $compile, $controller) {
                //          app.compile = $compile;
                //          app.$controller = $controller;
                app.rootScope = $rootScope;
                console.log("angular app module run");
                init();
            }
        ]);

        angular.element(document).ready(function() {
            angular.bootstrap(document, [app.module.name]);
        });


        return app;
};