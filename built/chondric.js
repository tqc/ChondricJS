/*! chondric-tools 2014-04-08 */
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
        var controllerPreload = {};
        var appModule = app.module = angular.module(options.name || "appModule", ['chondric'].concat(options.angularModules || []),
            function($controllerProvider) {
                app.controllerProvider = $controllerProvider;
                for (var cn in controllerPreload || {}) {
                    registerController(cn, controllerPreload[cn]);
                }
            });

        function registerController(name, func) {
            if (app.controllerProvider) {
                app.controllerProvider.register(name, func);
                delete controllerPreload[name];
            } else {
                controllerPreload[name] = func;
            }
        }

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
            if (viewOptions.initAngular) {
                viewOptions.initAngular.call(page);
                viewOptions.controllers = viewOptions.controllers || page.controllers;
            }
            var pageController = null;
            if (viewOptions.controller) {
                pageController = viewOptions.controller;
            }
            for (var cn in viewOptions.controllers || {}) {
                if (!pageController) {
                    pageController = viewOptions.controllers[cn];
                }
                registerController(cn, viewOptions.controllers[cn]);
            }
            if (!pageController) {
                console.error("View " + (viewOptions.templateId || viewOptions.route) + " has no controller");
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
                    pageController = viewOptions.controllers[cn];
                };
                registerController(cn, viewOptions.controllers[cn]);
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

            // these will usually get overridden on a child scope - otherwise names have to be globally unique
            $scope.showModal = function(name, lastTap) {
                $scope[name] = lastTap;
            }

            $scope.hideModal = function(name) {
                $scope[name] = null;
            }


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

            $scope.changePage = app.changePage = function(p, transition) {
                if (p instanceof Array) {
                    var r = "";
                    for (var i = 0; i < p.length; i++) {
                        r += "/" + p[i];
                    }
                } else {
                    var r = p;
                }
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

            function viewCleanup(viewCollection, preservedRoutes) {
                for (var k in viewCollection) {
                    if (k.indexOf("/") != 0) continue;
                    var keep = false;
                    for (var i = 0; i < preservedRoutes.length; i++) {
                        var r = preservedRoutes[i];
                        if (!r) continue;
                        if (r.indexOf(k) == 0) {
                            keep = true;
                            break;
                        }
                    }
                    if (!keep) {
                        delete viewCollection[k]
                        continue;
                    }
                    if (viewCollection[k].subsections) {
                        viewCleanup(viewCollection[k].subsections, preservedRoutes)
                    }

                }
            }

            $scope.$watch("route", function(url, oldVal) {
                $scope.nextRoute = null;
                $scope.lastRoute = oldVal;
                console.log("Route changed to " + url + " from " + oldVal);
                if (url) document.location.hash = url;
                loadView(url);
                console.log($scope.openViews);
                viewCleanup($scope.openViews, [$scope.route, $scope.nextRoute, $scope.lastRoute]);
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
    unload: function() {
        var view = this;
        if (view.element) view.element.remove();
        delete view.element;

        if (view.scope) {
            view.scope.$destroy();
            delete(view.scope);
        }

    },

    getViewTemplate: function(callback) {
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

            var ctrl = pe.attr("ng-controller") || html.attr("ng-controller");

            callback(content, ctrl);
        });

    },
    load: function() {
        var view = this;

        view.getViewTemplate(function(content, controllerName) {


            var ind = view.id.indexOf("_");
            var templateId = view.templateId || view.id.substr(0, ind) || view.id;
            view.dataId = view.id.substr(ind + 1) || "";
            view.params = view.dataId.split("_");

            controllerName = controllerName || view.controllerName || templateId + "Ctrl";

            var controller = null;

            view.initAngular();

            if (!controller && view.controller) {
                // look for a function provided as view.controller
                app.controllerProvider.register(controllerName, view.controller);
            } else if (!controller && view.controllers && view.controllers[controllerName]) {
                // look for a controller in view.controllers array
                for (var cn in view.controllers) {
                    app.controllerProvider.register(cn, view.controllers[cn]);
                }
            } else {
                // no defined controller - don't use one
                controllerName = null;
            }



            // todo: add data loading view to template content

            var fullcontent = "";
            if (controllerName) {
                fullcontent = "<div ng-controller='" + controllerName + "'>" + content + "</div>";
            } else {
                fullcontent = "<div ng-scope>" + content + "</div>";
            }


            var newelement = app.compile(fullcontent)(app.rootScope);
            view.element.append(newelement);



            view.scope = newelement.scope();




            if (view.isActivating) {
                view.activating();
                view.isActivating = false;
            }

            if (view.isActivated) {
                view.activated();
                view.isActivated = false;
            }

            view.scope.$apply();

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
;;

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

Chondric.directive('ngTap', function() {

    return function(scope, element, attrs) {
        element.addClass('tappable');
        // eanble use of app global in angular expression if necessary
        if (attrs.ngTap && attrs.ngTap.indexOf("app.") == 0 && !scope.app) scope.app = app;

        var active = false;
        var touching = false;

        // detect move and cancel tap if drag started
        var move = function(e) {
            cancel(e);
            //touching = false;
            //active = false;
        }

        // called if the mouse moves too much or leaves the element
        var cancel = function() {
            if (touching) {
                element.unbind('touchmove', move);
                element.unbind('touchend', action);
            } else {
                element.unbind('mousemove', move);
                element.unbind('mouseout', cancel);
                element.unbind('mouseup', action);
            }

            element.removeClass('active');
            element.addClass('deactivated');

            touching = false;
            active = false;
        }

        // called when a tap is completed
        var action = function(e) {

            scope.lastTap = {
                element: element,
                x: e.originalEvent.changedTouches ? e.originalEvent.changedTouches.offsetX : e.offsetX,
                y: e.originalEvent.changedTouches ? e.originalEvent.changedTouches.offsetY : e.offsetY
            }
            scope.$apply(attrs['ngTap'], element);


            if (touching) {
                element.unbind('touchmove', move);
                element.unbind('touchend', action);
            } else {
                element.unbind('mousemove', move);
                element.unbind('mouseout', cancel);
                element.unbind('mouseup', action);
            }

            touching = false;
            active = false;
            element.removeClass('active');
            element.addClass('deactivated');


        }

            function start() {

                if (touching) {
                    element.bind('touchmove', move);
                    element.bind('touchend', action);

                } else {
                    element.bind('mousemove', move);
                    element.bind('mouseout', cancel);
                    element.bind('mouseup', action);
                }

                element.addClass('active');
                element.removeClass('deactivated');
                active = true;
            }

            // called on mousedown or touchstart. Multiple calls are ignored.
        var mouseStart = function() {
            if (active || touching) return;
            touching = false;
            start();
        }

        var touchStart = function() {
            if (active) return;
            if (useMouse) {
                element.unbind('mousedown', mouseStart);
                useMouse = false;
            }
            touching = true;
            start();
        }

        var useMouse = true;

        var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

        if (iOS)
            element.bind('touchstart', touchStart);
        else {
            element.bind('mousedown', mouseStart);
        }
    };
})
// add a loading overlay if the scope has dataLoadStatus.waitingForData set.
// if dataLoadStatus.error is set, it will be displayed as an error message.
// if dataLoadStatus.retry is a function, a button wil be displayed
// if dataLoadStatus.cancel is set, a button will be displayed.
Chondric.directive('loadingOverlay', function($compile) {
    return {
        replace: true,
        template: '<div class="loadingoverlay" ng-show="dataLoadStatus.waitingForData"><div ng-show="!dataLoadStatus.error" class="progress large"><div></div></div><div ng-show="!dataLoadStatus.error">Loading</div><div class="error" ng-show="dataLoadStatus.error">{{dataLoadStatus.error}}</div><div><button ng-show="dataLoadStatus.retry && dataLoadStatus.error" ng-tap="dataLoadStatus.retry()">Retry</button><button ng-show="dataLoadStatus.cancel" ng-tap="dataLoadStatus.cancel()">Cancel</button></div></div>'
    }
});
Chondric.directive("cjsPopover", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {
            element.addClass("popover");

            var overlay = $(".modal-overlay", element.parent());
            if (overlay.length == 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                element.parent().append(overlay);
            }
            overlay.on("mousedown touchstart", function() {
                console.log("overlay touch");
                scope.$apply("hideModal('" + attrs.cjsPopover + "')");
            });
            scope.$watch(attrs.cjsPopover, function(val) {
                if (!val) {
                    element.removeClass("active");
                } else {
                    var button = val.element[0];
                    var menupos = {};
                    // TODO: should get actual size of the element, but it is display:none at this point.
                    var menuwidth = 280;

                    var sw = element[0].offsetParent.offsetWidth;
                    var sh = element[0].offsetParent.offsetHeight;
                    var cr = button.getBoundingClientRect();

                    if (cr.bottom > sh / 2) {
                        menupos.bottom = (sh - cr.top + 12) + "px";
                        menupos.top = "auto";
                        element.addClass("up").removeClass("down");
                    } else {
                        menupos.top = (cr.bottom + 12) + "px";
                        menupos.bottom = "auto";
                        element.addClass("down").removeClass("up");
                    }
                    var left = ((button.offsetLeft + button.offsetWidth / 2) - menuwidth / 2);


                    if (left < 10) {
                        left = 10;
                    }
                    if (left + menuwidth > sw - 10) {
                        left = (sw - menuwidth - 10);
                    }
                    menupos.left = left + "px"

                    var indel = $(".poparrow", element);
                    if (indel.length > 0) {
                        var arrowleft = (cr.left + cr.width / 2) - 13 - left;
                        if (arrowleft < 10) arrowleft = 10;
                        if (arrowleft + 26 > menuwidth - 10) arrowleft = menuwidth - 10 - 26;
                        indel.css("left", arrowleft + "px");
                    }

                    element.addClass("active");
                    element.css(menupos);
                }
            })
        }
    }
});
Chondric.directive("cjsPopup", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {
            element.addClass("popup");
            var overlay = $(".modal-overlay", element.parent());
            if (overlay.length == 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                element.parent().append(overlay);
            }
            overlay.on("mousedown touchstart", function() {
                console.log("overlay touch");
                scope.$apply("hideModal('" + attrs.cjsPopup + "')");
            });
            scope.$watch(attrs.cjsPopup, function(val) {
                if (!val) {
                    element.removeClass("active");
                } else {
                    element.addClass("active");
                }
            })
        }
    }
});
Chondric.directive("previewcontrols", function() {

    return {
        restrict: "E",
        template: "<div id='previewcontrols'>" + "<button ng-tap='updatePreviewSettings(1024,768, true)'>iPad landscape</button>" + "<button ng-tap='updatePreviewSettings(768, 1024, true)'>iPad portrait</button>" + "<button ng-tap='updatePreviewSettings(568,320, true)'>iPhone5 landscape</button>" + "<button ng-tap='updatePreviewSettings(320, 568, true)'>iPhone5 portrait</button>" + "<button ng-tap='updatePreviewSettings(1024,748, false)'>iPad landscape iOS6</button>" + "<button ng-tap='updatePreviewSettings(768, 1004, false)'>iPad portrait iOS6</button>" + "<button ng-tap='updatePreviewSettings(568,300, false)'>iPhone5 landscape iOS6</button>" + "<button ng-tap='updatePreviewSettings(320,548, false)'>iPhone5 portrait iOS6</button>" + "<button ng-tap='reloadPreview()'>Reload</button>"

        + "</div>",
        link: function(scope, element, attrs) {
            scope.previewSettings = {
                width: 1024,
                height: 768,
                overlayStatusBar: true
            };
            scope.reloadPreview = function() {
                document.getElementById("preview").contentDocument.location.reload(true);
            }
            scope.updatePreviewSettings = function(w, h, overlayStatusBar) {
                scope.previewSettings = {
                    width: w,
                    height: h,
                    overlayStatusBar: overlayStatusBar
                };
            };
        }
    }
});
Chondric.directive('chondricViewport', function($compile) {
    return {
        scope: true,
        link: function(scope, element, attrs) {
            //            console.log("viewport directive");
            var rk = scope.$eval("rk");
            var rv = scope.$eval("rv");
            if (rv) scope.pageParams = rv.params || {};
            if (rk) scope.pageRoute = rk;

            if (!rk && attrs["chondric-viewport"] == "1") return;

            var template = "";
            if (!rv) {
                // first level
                element.addClass("chondric-viewport");
                //                template = "<div class=\"chondric-viewport\">"
                template = "<div ng-repeat=\"(rk, rv) in openViews\" chondric-viewport=\"1\" class=\"{{transition}} {{rv.templateId}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute, notransition: noTransition}\" route=\"{{rk}}\">"
                template += "</div>"
                //                template += "</div>"

            } else if (rv.isSection) {
                template = "<div ng-controller=\"rv.controller\" >"
                template += "<div ng-repeat=\"(rk, rv) in rv.subsections\" chondric-viewport=\"1\" class=\"{{transition}} {{rv.templateId}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute, notransition: noTransition}\" route=\"{{rk}}\">"
                template += "</div>"
                template += "</div>"

            } else if (rv.templateUrl) {
                template = "<div ng-include src=\"rv.templateUrl\" ng-controller=\"rv.controller\"></div>";
                template += '<div loading-overlay></div>'

            } else {
                template = "<span>Template not set</span>"
            }

            var newElement = angular.element(template);
            $compile(newElement)(scope);
            element.html("");
            element.append(newElement);
        }
    }
});
Chondric.Syncable = function(options) {
    var syncable = this;

    var localIndex = {};
    var remoteIndex = {};

    var settings = syncable.settings = {
        bulkSave: false,
        saveAllToDb: function(localIndex) {},
        saveToDb: function(wrapper) {},
        removeFromDb: function(wrapper) {},
        getRemoteId: function(remoteVersion) {
            return remoteVersion.key;
        },
        merge: function(wrapper, callback) {
            // todo: default merge implementation
            // todo: merge instead of overwriting local changes 
            if (!wrapper.localId) wrapper.localId = wrapper.remoteId;

            if (!wrapper.hasLocalChanges) {
                wrapper.localVersion = wrapper.unmergedRemoteVersion;
            }

            if (wrapper.unmergedRemoteVersion) {
                wrapper.remoteVersion = wrapper.unmergedRemoteVersion;
                delete wrapper.unmergedRemoteVersion;
            }
            if (wrapper.remoteVersion) {
                wrapper.remoteId = settings.getRemoteId(wrapper.remoteVersion);
            }

            callback();
        },
        upload: function(wrapper, callback) {
            callback();
            // todo: post update
            //                                app.coreApiPost("/servers/", "", function(ns) {

            //                              })
            //                            projectSource.uploadIssue(project, wrapper, onProgress, callback);

        }
    };

    $.extend(settings, options);


    syncable.updateIndex = function(wrapper) {
        if (wrapper.remoteId) remoteIndex[wrapper.remoteId] = wrapper;
        if (wrapper.localId) localIndex[wrapper.localId] = wrapper;
    };

    // return wrapper object as it exists - local, remote or both may be unset.
    // if a new wrapper is created it will be created with the known remote id.

    syncable.getByRemoteId = function(id, callback) {
        if (remoteIndex[id]) {
            return callback(remoteIndex[id]);
        } else {
            var wrapper = {
                remoteId: id
            };
            return callback(wrapper);
        }
    };

    // local id should always be valid
    syncable.getByLocalId = function(id, callback) {
        return callback(localIndex[id]);
    };

    syncable.addNew = function(localId, localVersion) {
        var wrapper = {
            localId: localId,
            localVersion: localVersion,
            hasLocalChanges: true,
            lastModified: new Date().getTime()
        };
        syncable.updateIndex(wrapper);
        return wrapper;
    };

    syncable.save = function(wrapper) {
        syncable.updateIndex(wrapper);
        if (settings.bulkSave) {
            settings.saveAllToDb(localIndex);
        } else {
            settings.saveToDb(wrapper);
        }
    };

    syncable.queueSave = function(wrapper, lastModified, isSystemUpdate) {
        // todo: timer implementation / single bulk save
        if (!isSystemUpdate) wrapper.hasLocalChanges = true;
        wrapper.lastModified = lastModified || new Date().getTime();
        syncable.save(wrapper);

    };

    // ensure all are in the in memory list. 
    // db is not independently accessible, so no need to load any that are already present
    syncable.loadFromDbResults = function(wrappers) {
        for (var i = 0; i < wrappers.length; i++) {
            var wrapper = wrappers[i];
            if (wrapper.remoteId && remoteIndex[wrapper.remoteId]) continue;
            if (wrapper.localId && localIndex[wrapper.localId]) continue;
            syncable.updateIndex(wrapper);
        }
    };


    syncable.loadSavedLocalIndex = function(data) {
        localIndex = data;
        for (var li in data) {
            syncable.updateIndex(data[li]);
        }
    };


    syncable.sync = function(
        // object needing sync
        wrapper,
        // function to get latest version from remote. can either call web service directly or use cached results from 
        // a getAll web service. should return null if remoteId is not set.
        getRemoteVersion,
        // function to perform a 3 way merge. May create localVersion if it doesn't exist, but must use 
        // existing object if it is set. 
        mergeFunction,
        // function to upload the local version to the remote. returns the updated remote version
        uploadFunction,
        callback) {

        getRemoteVersion(wrapper.remoteId, function(newRemoteVersion) {

            wrapper.unmergedRemoteVersion = newRemoteVersion;

            (mergeFunction || settings.merge)(wrapper, function() {
                // wrapper must now have local version set.
                // if merge changed anything, hasLocalChanges will be true
                syncable.updateIndex(wrapper);
                if (wrapper.hasLocalChanges) {
                    uploadFunction(wrapper, function() {
                        // this may update remote id and unmergedRemoteVersion, and should set hasLocalChanges to false if it succeeded.
                        (mergeFunction || settings.merge)(wrapper, function() {
                            syncable.updateIndex(wrapper);
                            syncable.queueSave(wrapper, wrapper.lastModified, true);
                            callback();
                        });
                    });
                } else {
                    syncable.queueSave(wrapper, wrapper.lastModified, true);
                    callback();
                }
            });

        });
    };


    // process multiple remote objects as an object containing remoteId:remoteVersion pairs
    syncable.syncRemoteIndex = function(remoteObjects, callback) {

        // get array of keys
        var keys = [];
        for (var rk in remoteObjects) {
            keys.push(rk);
        }


        var processItem = function(i) {
            if (i >= keys.length) return callback();

            syncable.getByRemoteId(keys[i], function(wrapper) {

                syncable.sync(wrapper,

                    function(remoteId, callback) {
                        callback(remoteObjects[keys[i]]);
                    },
                    settings.merge,
                    settings.upload,


                    function() {
                        processItem(i + 1);
                    })

            });


        };

        processItem(0);

    };

    syncable.syncRemoteArray = function(remoteObjects, callback) {

    };


    syncable.syncLocalChanges = function(
        callback
    ) {
        syncable.getItems(function(item) {
            return item.hasLocalChanges;
        }, function(changedItems) {
            var loopfn = function(i) {
                if (i >= changedItems.length) return callback();
                if (changedItems[i].unmergedRemoteVersion) return loopfn(i + 1);
                syncable.sync(changedItems[i],
                    function(remoteId, callback) {
                        callback(changedItems[i].remoteVersion);
                    },
                    settings.merge,
                    settings.upload, function() {
                        loopfn(i + 1);
                    });
            };
            loopfn(0);

        });
    };


    syncable.uncache = function(filter, callback) {
        var result = [];
        for (var li in localIndex) {
            var item = localIndex[li];
            if (!filter || filter(localIndex[li])) {
                delete localIndex[li];
                delete remoteIndex[item.remoteId];
                if (!settings.bulkSave) {
                    settings.removeFromDb(item);
                }
            }
        }
        if (settings.bulkSave) {
            settings.saveAllToDb(localIndex);
        }

        callback(result);
    };


    syncable.getItems = function(filter, callback) {
        var result = [];
        for (var li in localIndex) {
            if (!filter || filter(localIndex[li])) result.push(localIndex[li]);
        }
        callback(result);
    };



    return this;
};