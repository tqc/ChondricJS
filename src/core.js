// ie doesn't like console.log

if (!window.console) {
    window.console = {
        log: function() {},
        warn: window.alert,
        error: window.alert
    };
}

var Chondric = angular.module('chondric', []);
Chondric.allTransitions = {};
Chondric.sharedUiComponents = {};
Chondric.registerSharedUiComponent = function(componentOptions, componentCollection) {

    componentCollection = componentCollection || Chondric.sharedUiComponents;

    var component = {};
    if (componentOptions.baseComponentId) {
        $.extend(component, componentCollection[componentOptions.baseComponentId]);
        component["controller-" + componentOptions.baseComponentId] = component.controller;
        component.baseController = function(baseComponentId, $scope) {
            component["controller-" + componentOptions.baseComponentId]($scope);
        };
    }
    $.extend(component, componentOptions);

    componentCollection[component.id] = component;
};


Chondric.App =
    Chondric.initApp = function(options) {
        var app = {};
        var controllerPreload = {};
        app.module = angular.module(options.name || "appModule", ['chondric'].concat(options.angularModules || []),
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

        var allRoutes = app.allRoutes = {};

        app.allTransitions = Chondric.allTransitions;

        app.createViewTemplate = function(baseView, templateId, templateFile, viewOptions) {

            if (typeof templateId == "string") {
                // old format
                viewOptions.baseView = baseView;
                viewOptions.templateId = templateId;
                viewOptions.templateFile = templateFile;
            } else {
                viewOptions = baseView;
            }

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
                throw new Error("View " + (viewOptions.templateId || viewOptions.route) + " has no controller");
            }
            var route = viewOptions.route || ("/" + viewOptions.templateId + "/$p1/$p2");
            var templateUrl = viewOptions.templateId + ".html";
            if (viewOptions.templateFolder) templateUrl = viewOptions.templateFolder + "/" + templateUrl;
            allRoutes[route] = {
                isSection: false,
                controller: pageController,
                templateUrl: templateUrl,
                templateId: viewOptions.templateId
            };
            preloadTemplate(templateUrl);
        };

        function preloadTemplate(templateUrl) {
            app.module.run(function($templateCache, $http) {
                $http.get(templateUrl, {
                    cache: $templateCache
                });
            });
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
                }
                registerController(cn, viewOptions.controllers[cn]);
            }

            var route = viewOptions.route;

            allRoutes[route] = {
                isSection: true,
                controller: pageController
                    //            templateUrl: viewOptions.templateUrl,
                    //            templateId: viewOptions.templateId,
            };
        };

        app.sharedUiComponents = {};
        for (var k in Chondric.sharedUiComponents) {
            var sc = Chondric.sharedUiComponents[k];
            var ac = app.sharedUiComponents[k] = {};
            $.extend(ac, sc);
            ac.app = app;
        }

        app.registerSharedUiComponent = function(component) {
            component.app = app;
            Chondric.registerSharedUiComponent(component, app.sharedUiComponents);
        };

        app.controller = function($scope, $location, $element, $attrs) {
            app.scope = $scope;
            $scope.app = app;
            $scope.allRoutes = allRoutes;
            $scope.route = null;
            $scope.nextRoute = null;
            $scope.lastRoute = null;
            $scope.transition = {
                type: "crossfade",
                progress: 0
            };

            $scope.openViews = {};
            $scope.sharedUiComponents = app.sharedUiComponents;

            // these will usually get overridden on a child scope - otherwise names have to be globally unique
            $scope.showModal = function(name, lastTap) {
                $scope[name] = lastTap;
            };

            $scope.hideModal = function(name) {
                $scope[name] = null;
            };

            $scope.updateSwipeNav = app.updateSwipeNav = function(routeScope, data) {
                var d = app.swipeNavForRoutes[routeScope.rk] || {};
                $.extend(d, data);
                app.swipeNavForRoutes[routeScope.rk] = d;
                routeScope.swipeNav = d;
                if ($scope.route == routeScope.rk) {
                    if (window.NativeNav) {
                        window.NativeNav.setValidGestures(d);
                    }
                }
            };

            $scope.getSharedUiComponentState = app.getSharedUiComponentState = function(routeScope, componentId) {
                app.scopesForRoutes[routeScope.rk] = routeScope;

                var component = app.sharedUiComponents[componentId];
                if (!component) {
                    throw new Error(
                        "Shared UI Component " + componentId + " not found"
                    );
                }

                var csfr = app.componentStatesForRoutes[routeScope.rk] = app.componentStatesForRoutes[routeScope.rk] || {};
                var cs = csfr[componentId] = csfr[componentId] || {
                    route: routeScope.rk,
                    active: false,
                    available: false,
                    data: {}
                };

                return cs;

            };


            $scope.setSharedUiComponentState = app.setSharedUiComponentState = function(routeScope, componentId, active, available, data) {
                var cs = app.getSharedUiComponentState(routeScope, componentId);
                // if parameters are undefined, the previous value will be used
                if (active === true || active === false) cs.active = active;
                if (available === true || available === false) cs.available = available;
                if (data !== undefined) cs.data = data;
                var uc = routeScope.usedComponents;
                var uci = uc.asArray.indexOf("uses-" + componentId);
                if (available && uci < 0) {
                    uc.asArray.push("uses-" + componentId);
                    uc.asString = uc.asArray.join(" ");
                } else if (!available && uci >= 0) {
                    uc.asArray.splice(uci, 1);
                    uc.asString = uc.asArray.join(" ");
                }

                var component = app.sharedUiComponents[componentId];

                if (component.getSwipeNav) app.updateSwipeNav(routeScope, component.getSwipeNav(component, cs.active, cs.available));

                if ($scope.route == routeScope.rk) {
                    component.setState(component, routeScope.rk, cs.active, cs.available, cs.data);
                }

            };


            app.scopesForRoutes = {};
            app.scrollPosForRoutes = {};
            app.swipeNavForRoutes = {};
            app.transitionOriginForRoutes = {};
            app.componentStatesForRoutes = {};

            $scope.openViewArray = [];

            function updateOpenViewArray(parentObject, parentArray) {
                parentArray.splice(0, parentArray.length);
                for (var k in parentObject) {
                    var v = parentObject[k];
                    parentArray.push(v);
                    if (v.subsections) {
                        v.subsectionArray = v.subsectionArray || [];
                        updateOpenViewArray(v.subsections, v.subsectionArray);
                    }
                }
            }


            var loadView = app.loadView = function(url, position) {
                if (!url) {
                    // first run - load start page
                    throw new Error("loadView requires a valid route URL");
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
                    return a.length - b.length;
                });

                // matching routes list should be section heirarchy

                var openViews = $scope.openViews;
                for (var i2 = 0; i2 < matchingRoutes.length; i2++) {
                    var template = $scope.allRoutes[matchingRoutes[i2]];
                    var mrp = matchingRoutes[i2].split("/");
                    var ar = "";
                    var params = {};
                    for (var j = 0; j < mrp.length; j++) {
                        if (mrp[j][0] == "$" && parts[j]) params[mrp[j].substr(1)] = decodeURIComponent(parts[j]);
                        if (parts[j]) ar += "/" + parts[j];
                    }
                    if (template.isSection) {
                        var section = openViews[ar];
                        if (!section) {
                            section = openViews[ar] = {
                                route: ar,
                                controller: template.controller,
                                isSection: true,
                                params: params,
                                subsections: {}
                            };
                        }
                        openViews = section.subsections;
                    } else {
                        var page = openViews[ar];
                        if (!page) {
                            page = openViews[ar] = {
                                route: ar,
                                controller: template.controller,
                                templateUrl: template.templateUrl,
                                templateId: template.templateId,
                                params: params
                            };
                        }
                        if (position) page.position = position;
                    }
                    updateOpenViewArray($scope.openViews, $scope.openViewArray);

                }
            };

            $scope.changePage = app.changePage = function(p, transition, originElement) {
                var r;
                if (p instanceof Array) {
                    r = "";
                    for (var i = 0; i < p.length; i++) {
                        r += "/" + p[i];
                    }
                } else {
                    r = p;
                }
                if (!r || r.indexOf("/") < 0) {
                    throw new Error("changePage syntax has changed - the first parameter is a route url or an array of route url segments instead of an id");
                }
                if ($scope.route == r) return;
                if ($scope.lastRoute == r) $scope.lastRoute = null;

                var fromRoute = $scope.route;
                var toRoute = r;
                var fromRect = null;

                if (fromRoute) {
                    app.scrollPosForRoutes[fromRoute] = {
                        x: window.scrollX,
                        y: window.scrollY
                    };

                    if (originElement && originElement.length) {
                        // todo: find parent element if necessary and set appropriate origin rect                   
                        fromRect = app.transitionOriginForRoutes[fromRoute] = originElement[0].getBoundingClientRect();
                    } else {
                        fromRect = app.transitionOriginForRoutes[fromRoute] = null;
                    }
                }


                if (app.transitionMode == "none") {
                    loadView(r);
                    window.setTimeout(function() {
                        $scope.route = r;
                        $scope.$apply();
                        transitionComponents(fromRoute, toRoute, 1);
                        $scope.$apply();
                    }, 10);

                } else if (app.transitionMode == "native") {
                    // disable pointer events for 300ms to prevent ghost clicks.
                    if (window.jstimer) window.jstimer.start("transitioningTimeout");

                    $(document.body).addClass("cjs-transitioning");
                    window.setTimeout(function() {
                        if (window.jstimer) window.jstimer.finish("transitioningTimeout");
                        $(document.body).removeClass("cjs-transitioning");
                    }, 300);
                    var actualTransition = "crossfade";
                    var originRect = null;
                    if (transition == "zoomin" && fromRect) {
                        actualTransition = "zoomin";
                        originRect = fromRect;
                    }
                    if (transition == "zoomout" && app.transitionOriginForRoutes[toRoute]) {
                        actualTransition = "zoomout";
                        originRect = app.transitionOriginForRoutes[toRoute];
                    }

                    window.NativeNav.startNativeTransition(actualTransition, originRect, function() {
                        //                        $(".chondric-page.active").removeClass("active");
                        if (window.jstimer) window.jstimer.finish("transitioningCallback1");
                        if (window.jstimer) window.jstimer.start("transitioningTimeout2");
                        window.setTimeout(function() {
                            if (window.jstimer) window.jstimer.finish("transitioningTimeout2");
                            if (window.jstimer) window.jstimer.start("transitioningTimeout3");
                            loadView(r);
                            $scope.route = r;
                            $scope.$apply();
                            transitionComponents(fromRoute, toRoute, 1);
                            $scope.$apply();
                            window.NativeNav.finishNativeTransition();
                            if (window.jstimer) window.jstimer.finish("transitioningTimeout3");
                        }, 0);

                    });
                } else {

                    $scope.transition.type = transition || "crossfade";
                    $scope.noTransition = true;
                    loadView(r);
                    $scope.nextRoute = r;
                    $scope.transition.progress = 0;
                    $scope.transition.from = $scope.route;
                    $scope.transition.to = $scope.nextRoute;
                    $scope.transition.fromRect = fromRect;

                    if (fromRoute) {
                        $scope.transition.fromScroll = app.scrollPosForRoutes[fromRoute];
                        $scope.transition.fromRect = app.transitionOriginForRoutes[fromRoute];
                    }
                    $scope.transition.toRect = app.transitionOriginForRoutes[$scope.transition.to];

                    $scope.transition.toScroll = app.scrollPosForRoutes[$scope.transition.to] || {
                        x: 0,
                        y: 0
                    };
                    window.setTimeout(function() {
                        $scope.noTransition = false;
                        $scope.route = r;
                        $scope.transition.progress = 1;
                        $scope.$apply();
                    }, 100);
                }
            };

            $scope.updateSwipe = function(swipeState, swipeNav, pageScope) {
                if (!swipeState) return;

                for (var k in app.sharedUiComponents) {
                    var component = app.sharedUiComponents[k];
                    if (component.updateSwipe) component.updateSwipe(component, swipeState);
                }

                if (!swipeNav) return;

                // default handler covers left and right border swipe
                for (var p in swipeState) {
                    if (swipeState[p] && swipeNav[p]) {
                        if (swipeNav[p].route) {
                            loadView(swipeNav[p].route);
                            $scope.nextRoute = swipeNav[p].route;
                            $scope.transition.from = $scope.route;
                            $scope.transition.to = $scope.nextRoute;
                            $scope.transition.type = swipeNav[p].transition;

                            $scope.transition.progress = swipeState[p];
                        } else if (swipeNav[p].panel) {
                            var showModal = pageScope.$eval("showModal");
                            showModal(swipeNav[p].panel, {
                                progress: swipeState[p],
                                transition: swipeNav[p].transition
                            });
                        }
                        $scope.$apply();
                    }

                }
            };

            $scope.endSwipe = function(swipeState, swipeNav, pageScope) {
                if (!swipeState) return;

                for (var k in app.sharedUiComponents) {
                    var component = app.sharedUiComponents[k];
                    if (component.endSwipe) component.endSwipe(component, swipeState);
                }

                if (!swipeNav) return;

                for (var p in swipeState) {
                    if (swipeState[p] && swipeNav[p]) {
                        if (swipeNav[p].route) {
                            if (swipeState[p] > 0.4) {
                                // continue change to next page
                                loadView(swipeNav[p].route);
                                $scope.transition.progress = 1;
                                $scope.lastRoute = $scope.route;
                                $scope.route = swipeNav[p].route;
                            } else {
                                // cancel page change
                                $scope.transition.progress = 0;
                            }

                        } else if (swipeNav[p].panel) {
                            if (swipeState[p] > 0.1) {
                                var showModal = pageScope.$eval("showModal");
                                showModal(swipeNav[p].panel, {
                                    progress: 1,
                                    transition: swipeNav[p].transition
                                });
                            } else {
                                var hideModal = pageScope.$eval("hideModal");
                                hideModal(swipeNav[p].panel);

                            }
                        }

                        $scope.$apply();
                    }
                }

            };


            function viewCleanup(viewCollection, preservedRoutes) {
                for (var k in viewCollection) {
                    if (k.indexOf("/") !== 0) continue;
                    var keep = false;
                    for (var i = 0; i < preservedRoutes.length; i++) {
                        var r = preservedRoutes[i];
                        if (!r) continue;
                        if (r.indexOf(k) === 0) {
                            keep = true;
                            break;
                        }
                    }
                    if (!keep) {
                        for (var csfrk in app.componentStatesForRoutes) {
                            if (csfrk.indexOf(k) === 0) delete app.componentStatesForRoutes[csfrk];
                        }
                        for (var sfrk in app.scopesForRoutes) {
                            if (sfrk.indexOf(k) === 0) delete app.scopesForRoutes[sfrk];
                        }
                        delete viewCollection[k];
                        continue;
                    }
                    if (viewCollection[k].subsections) {
                        viewCleanup(viewCollection[k].subsections, preservedRoutes);
                    }

                }

                updateOpenViewArray($scope.openViews, $scope.openViewArray);

            }

            function transitionComponents(fromRoute, toRoute, progress) {
                if (!toRoute) return;

                var fromStates = app.componentStatesForRoutes[fromRoute] || {};
                var toStates = app.componentStatesForRoutes[toRoute] || {};

                for (var k in app.sharedUiComponents) {
                    var component = app.sharedUiComponents[k];
                    var fromState = fromStates[k] || {
                        route: fromRoute,
                        active: false,
                        available: false,
                        data: {}
                    };
                    var toState = toStates[k] || {
                        route: toRoute,
                        active: false,
                        available: false,
                        data: {}
                    };
                    if (component.setStatePartial) {
                        component.setStatePartial(component, fromState, toState, progress);
                    } else {
                        if (progress > 0.5) {
                            component.setState(component, toState.route, toState.active, toState.available, toState.data);
                        } else {
                            component.setState(component, fromState.route, fromState.active, fromState.available, fromState.data);
                        }
                    }
                }

            }

            $scope.$watch("transition", function(transition) {
                if (!transition) return;
                if (!transition.to) return;

                transitionComponents(transition.from, transition.to, transition.progress);


            }, true);


            $scope.$watch("route", function(url, oldVal) {
                if (!url) return;
                if (document.activeElement && app.transitionMode != "native" && document.activeElement.tagName != "BODY") {
                    if ($(document.activeElement).closest(".body").length > 0) {
                        // only blur if the active element was inside a page body - page headers etc can remain focused.
                        document.activeElement.blur();
                    }
                }
                $scope.nextRoute = null;
                $scope.lastRoute = oldVal;
                $location.path(url).replace();
                loadView(url);
                viewCleanup($scope.openViews, [$scope.route, $scope.nextRoute, $scope.lastRoute].concat(app.preloadedRoutes || []));
                if (window.NativeNav) {
                    window.NativeNav.setValidGestures(app.swipeNavForRoutes[url] || {});
                }

                window.setTimeout(function() {
                    var sp = app.scrollPosForRoutes[url];
                    if (sp) {
                        window.scrollTo(sp.x, sp.y);
                    } else {
                        window.scrollTo(0, 0);
                    }
                }, 10);
            });
            app.attrs = $attrs;
            app.element = $element;

            if (options.appCtrl) options.appCtrl($scope);
        }; // end appCtrl

        app.ready = false;
        app.autohidesplashscreen = false;
        app.Pages = {};
        app.Actions = {};

        app.startTime = new Date().getTime();

        app.Views = {};
        app.ViewTemplates = {};

        app.platform = "web";
        app.isSimulator = false;

        var settings = {
            name: "Base App",
            mightBePhoneGap: true,
            enableTransitions: true,
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
                // jshint unused: false
                // send details to the notification server
                console.warn("updateNotificationSettings is not implemented");
            },
            notificationReceived: function(event) {
                // jshint unused: false
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



        function initData(callback) {
            app.db = settings.getDatabase();
            if (!app.db) {
                callback();
            } else {
                if (app.db.updateDatabase) {
                    app.db.updateDatabase(function() {
                        callback();
                    });
                } else {
                    callback();
                }
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

        var initEvents = function(callback) {
            callback();
        };

        var loadFirstPage = function(callback) {
            // if first page is not specified in settings or hash, custominit is responsible for loading it

            if (app.scope.route) return callback(); // already loaded by custominit

            // var startPageFromAttr = $(document.body).attr("start-page") || $(document.body).attr("data-start-page")

            if (settings.loadPageFromHash && location.hash.length > 1 && location.hash.indexOf("access_token=") < 0) {
                var parts = location.hash.substr(2).split("/");
                for (var i = 0; i < parts.length; i++) {
                    parts[i] = decodeURIComponent(parts[i]);
                }
                app.changePage(parts);
            } else if (app.attrs && app.attrs.startPage) {
                app.changePage(app.attrs.startPage, "crossfade");
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
                error: function() {
                    console.warn("error loading ../settings.json - using default");
                    app.hostSettings = {};
                    callback();
                },
                success: function(data) {
                    app.hostSettings = data;
                    if (data.debug !== undefined) app.debugMode = data.debug;
                    callback();
                }
            });
        };

        app.init = function() {
            throw new Error("no longer need to call app.init manually");
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
                    //                    console.log("Size changed: " + w + "x" + h);
                    if (app.platform == "cordova" && (h == 1024 || h == 768 || h == 320 || h == 568 || h == 480)) {
                        $(".chondric-viewport").addClass("hasstatusbar");
                    } else {
                        $(".chondric-viewport").removeClass("hasstatusbar");
                    }

                    // for phone screens a multicolumn layout doesn't make sense
                    if (w < 768 && app.scope.maxColumns != 1) {
                        console.log("setting singlecolumn");
                        app.scope.maxColumns = 1;
                        $(".viewport").addClass("singlecolumn");
                        app.scope.$apply();
                    } else if (w >= 768 && app.scope.maxColumns != 3) {
                        console.log("setting multicolumn");
                        app.scope.maxColumns = 3;
                        $(".viewport").removeClass("singlecolumn");
                        app.scope.$apply();
                    }


                };
                sizeChanged();
                $(window).on("resize", sizeChanged);
                console.log("begin internal init");
                initEvents(function() {
                    loadHostSettings(function() {
                        // if in debug mode and there are tests specified, load them
                        if (app.hostSettings.debug && app.hostSettings.tests && app.hostSettings.tests.length) {
                            $("head").append('<script src="bower_components/mocha/mocha.js"></script>');
                            $("head").append('<script>mocha.setup("' + (app.hostSettings.mochaInterface || "bdd") + '")</script>');
                            $("head").append('<link rel="stylesheet" href="bower_components/mocha/mocha.css" />');
                            $("head").append('<script src="bower_components/chai/chai.js"></script>');
                            for (var i = 0; i < app.hostSettings.tests.length; i++) {
                                $("head").append('<script src="' + app.hostSettings.tests[i] + '"></script>');
                            }
                        }

                        // create database
                        initData(function() {
                            //load data
                            settings.loadData.call(app, null, function() {
                                // attach common events
                                attachEvents(function() {

                                    app.transitionMode = settings.enableTransitions ? "html" : "none";

                                    if (window.NativeNav) {
                                        if (settings.enableTransitions) app.transitionMode = "native";
                                        window.NativeNav.handleAction = function(route, action) {
                                            var routeScope = app.scopesForRoutes[route];
                                            if (routeScope) {
                                                routeScope.$apply(action);
                                            }
                                        };
                                        var gestureOpenedComponent = null;
                                        window.NativeNav.updateViewWithComponent = function(componentId) {
                                            // fill the frame with a side panel
                                            console.log("NativeNav requested component " + componentId);
                                            gestureOpenedComponent = app.sharedUiComponents[componentId];
                                            if (gestureOpenedComponent.forceShow) gestureOpenedComponent.forceShow(gestureOpenedComponent);
                                            window.NativeNav.setCloseModalCallback(gestureOpenedComponent.scope.hideModal);
                                            app.scope.$apply();

                                        };

                                        window.NativeNav.updateViewWithRoute = function(newRoute) {
                                            // move to the next route
                                            console.log("NativeNav requested route " + newRoute);
                                        };

                                        window.NativeNav.cancelGesture = function() {
                                            console.log("Gesture canceled");
                                            if (gestureOpenedComponent) {
                                                if (gestureOpenedComponent.forceHide) gestureOpenedComponent.forceHide(gestureOpenedComponent);
                                                app.scope.$apply();
                                            }
                                        };


                                    }

                                    $("body").addClass("cjs-transitions-" + app.transitionMode);
                                    if (app.transitionMode == "html") {
                                        $("body").addClass("cjs-scrolling-page");
                                    } else {
                                        $("body").addClass("cjs-scrolling-window");
                                    }

                                    if (window.Keyboard) {
                                        window.Keyboard.onshowing = function() {
                                            $("body").addClass("haskeyboard");
                                        };
                                        window.Keyboard.onhiding = function() {
                                            $("body").removeClass("haskeyboard");
                                        };
                                        /*
                                        window.Keyboard.onshowing = function() {
                                            $("body").addClass("haskeyboard");
                                            var t0 = new Date().getTime();

                                            window.setTimeout(function() {
                                                var sel = window.getSelection();
                                                if (sel && sel.type == "Caret") {
                                                    var fn = sel.focusNode;
                                                    if (fn.nodeName == "#text") fn = fn.parentElement;
                                                    var scrollContainer = $(fn).closest(".body")[0];
                                                    var scr = scrollContainer.getBoundingClientRect();
                                                    var fnr = fn.getBoundingClientRect();
                                                    var startTop = scrollContainer.scrollTop;
                                                    var targetTop = scrollContainer.scrollTop + fnr.top - scr.top - 100;


                                                    var step = function() {
                                                        var t = new Date().getTime();
                                                        var dt = t - t0;
                                                        if (dt > 300) {
                                                            scrollContainer.scrollTop = targetTop;
                                                        } else {
                                                            scrollContainer.scrollTop = Math.round(startTop + ((targetTop - startTop) * dt / 300));
                                                            window.requestAnimationFrame(step);
                                                        }
                                                    };
                                                    window.requestAnimationFrame(step);

                                                }

                                            }, 0);
                                        };
                                        window.Keyboard.onhiding = function() {
                                            $("body").removeClass("haskeyboard");
                                        };
                                        window.Keyboard.onshow = function() {

                                        };
*/
                                    }



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
            };

            if (settings.mightBePhoneGap && document.location.protocol == "file:") {
                // file protocol indicates phonegap
                app.isPhonegap = true;
                app.platform = "cordova";
                document.addEventListener("deviceready", function() {
                    console.log("appframework deviceready");
                    if (window.device) {
                        app.isSimulator = window.device.platform.indexOf("Simulator") > 0;
                    }
                    $(initInternal);
                }, false);
            } else {
                // no phonegap - web preview mode
                app.platform = "web";
                $(initInternal);
            }

        };

        app.module.run(["$rootScope", "$compile", "$controller",
            function($rootScope) {
                app.rootScope = $rootScope;
                init();
            }
        ]);

        angular.element(document).ready(function() {
            angular.bootstrap(document, [app.module.name]);
        });

        return app;
    };

Chondric.factory('sharedUi', function() {
    // A simplified interface for the shared ui components

    return {
        init: function($scope, componentAliases) {
            var service = {};
            var app = $scope.app;
            service.route = $scope.rk;
            $scope.sharedUi = service;
            service.addComponent = function(alias, componentKey) {
                service[alias] = {
                    setState: function(active, available, data) {
                        app.setSharedUiComponentState($scope, componentKey, active, available, data);
                    },
                    enable: function(data) {
                        app.setSharedUiComponentState($scope, componentKey, undefined, true, data);
                    },
                    disable: function() {
                        app.setSharedUiComponentState($scope, componentKey, false, false, undefined);
                    },
                    show: function(data) {
                        app.setSharedUiComponentState($scope, componentKey, true, true, data);
                    },
                    hide: function(disable) {
                        app.setSharedUiComponentState($scope, componentKey, false, !disable, undefined);
                    },
                    replaceData: function(data) {
                        app.setSharedUiComponentState($scope, componentKey, undefined, undefined, data);
                    },
                    extendData: function(update) {
                        var state = app.getSharedUiComponentState($scope, componentKey);
                        var newData = $.extend(state.data || {}, update);
                        app.setSharedUiComponentState($scope, componentKey, state.active, state.available, newData);
                    },
                    updateState: function(fn) {
                        var state = app.getSharedUiComponentState($scope, componentKey);
                        fn(state);
                        app.setSharedUiComponentState($scope, componentKey, state.active, state.available, state.data);
                    }

                };
            };

            for (var alias in componentAliases) {
                service.addComponent(alias, componentAliases[alias]);
            }
            return service;
        }
    };
});



Chondric.directive('ngStylePrefixer', function() {

    var style = document.body.style;
    var transitionStyle = "transition";
    if (style.transition === undefined && style.webkitTransition !== undefined) transitionStyle = "-webkit-transition";
    else if (style.transition === undefined && style.mozTransition !== undefined) transitionStyle = "-moz-transition";

    var transformStyle = "transform";
    if (style.transform === undefined && style.webkitTransform !== undefined) transformStyle = "-webkit-transform";
    else if (style.transform === undefined && style.mozTransform !== undefined) transformStyle = "-moz-transform";

    return {
        restrict: "AC",
        link: function(scope, element, attr) {
            scope.$watch(attr.ngStylePrefixer, function ngStyleWatchAction(newStyles, oldStyles) {
                var k;
                if (oldStyles && (newStyles !== oldStyles)) {
                    for (k in oldStyles) {
                        element.css(k, '');
                    }
                }

                if (newStyles) {
                    var convertedStyles = {};

                    for (k in newStyles) {
                        var v = newStyles[k];
                        if (k == "transform") {
                            k = transformStyle;
                        }
                        if (k == "transition") {
                            if (v) v = v.replace("transform", transformStyle);
                        }

                        convertedStyles[k] = v;
                    }
                    element.css(convertedStyles);

                }
            }, true);
        }
    };
});
