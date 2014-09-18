/*! chondric-tools 0.6.0 */
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

            var loadView = app.loadView = function(url) {
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
                                controller: template.controller,
                                templateUrl: template.templateUrl,
                                templateId: template.templateId,
                                params: params
                            };
                        }
                        return;
                    }
                }
            }

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
            if (document.activeElement && app.transitionMode != "native" && document.activeElement.tagName != "BODY") document.activeElement.blur();
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
                if (oldStyles && (newStyles !== oldStyles)) {
                    for (var k in oldStyles) {
                        element.css(k, '');
                    }
                }

                if (newStyles) {
                    var convertedStyles = {};

                    for (var k in newStyles) {
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
angular.module('chondric').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('cjs-action-sheet.html',
    "<div cjs-popover=\"componentDefinition.popuptrigger\">\n" +
    "    <div class=\"poparrow\"></div>\n" +
    "    <button ng-repeat=\"b in componentDefinition.data.items\" ng-tap=\"handleSharedPopupButtonClick(b)\">{{b.title}}</button>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-left-panel.html',
    "<div cjs-sidepanel=\"componentDefinition.popuptrigger\" ng-class=\"{active: componentDefinition.active}\">\n" +
    "<div ng-if=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\" ng-include=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\"></div>\n" +
    "<div ng-if=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" cjs-json-template=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" data=\"componentDefinition.data\"></div>\n" +
    "</div>"
  );


  $templateCache.put('cjs-loading-overlay-compact.html',
    "<div class=\"cjs-loading-overlay cjs-loading-overlay-compact\">\n" +
    "    <div ng-show=\"!error\" class=\"progress small\">\n" +
    "        <div></div>\n" +
    "    </div>\n" +
    "    <div class=\"message\" ng-show=\"!error\">{{message || \"Loading\"}}</div>\n" +
    "    <div class=\"error\" ng-show=\"error\">{{error}}</div>\n" +
    "    <div class=\"buttons\">\n" +
    "        <button ng-show=\"retry && error\" ng-tap=\"retry()\">Retry</button>\n" +
    "        <button ng-show=\"cancel\" ng-tap=\"cancel()\">Cancel</button>\n" +
    "    </div>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-loading-overlay-simple.html',
    "<div class=\"cjs-loading-overlay cjs-loading-overlay-simple\">\n" +
    "    <div ng-show=\"!error\" class=\"progress small\">\n" +
    "        <div></div>\n" +
    "    </div>\n" +
    "    <div class=\"error\" ng-show=\"error\">{{error}}</div>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-loading-overlay.html',
    "<div class=\"cjs-loading-overlay cjs-loading-overlay-full\">\n" +
    "    <div ng-show=\"!error\" class=\"progress large\">\n" +
    "        <div></div>\n" +
    "    </div>\n" +
    "    <div class=\"title\" ng-show=\"title && !error\">{{title}}</div>\n" +
    "     <div class=\"message\" ng-show=\"!error\">{{message || \"Loading\"}}</div>\n" +
    "   <div class=\"error\" ng-show=\"error\">{{error}}</div>\n" +
    "    <div class=\"buttons\">\n" +
    "        <button ng-show=\"retry && error\" ng-tap=\"retry()\">Retry</button>\n" +
    "        <button ng-show=\"cancel\" ng-tap=\"cancel()\">Cancel</button>\n" +
    "    </div>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-navigation-bar.html',
    "<div class=\"navbar\" ng-repeat=\"state in componentDefinition.states track by $index\" ng-style-prefixer=\"{zIndex:(state.isActivating? 1200 : 1100), 'top': (state.translateY)+'px', opacity: state.opacity, 'transition': 'opacity 0.3s ease, top 0.3s ease'}\">\n" +
    "     <button class=\"left icon-left icon-custom\" ng-repeat=\"b in state.data.leftButtons\" ng-tap=\"handleSharedHeaderButtonClick(state, b, lastTap)\" ng-class=\"{'icon-only': (b.icon ? true: false)}\"><div ng-if=\"b.icon\" class=\"maskedicon\" ng-style=\"{'-webkit-mask-image': 'url('+b.icon+')'}\"></div> {{b.title}}</button>\n" +
    "        <h1 ng-show=\"!state.data.titleEditable\">{{state.data.title}}</h1>\n" +
    "        <input class=\"h1\" ng-show=\"state.data.titleEditable\" type=\"text\" ng-model=\"state.data.title\" ng-change=\"titleChanged(state)\" />\n" +
    "        <button class=\"right icon-right icon-custom\" ng-repeat=\"b in state.data.rightButtons\" ng-tap=\"handleSharedHeaderButtonClick(state, b, lastTap)\" ng-class=\"{'icon-only': (b.icon ? true: false)}\"><div ng-if=\"b.icon\" class=\"maskedicon\" ng-style=\"{'-webkit-mask-image': 'url('+b.icon+')'}\"></div> {{b.title}}</button>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('cjs-preview-controls.html',
    "<div id='previewcontrols'>\n" +
    "    <button ng-tap='updatePreviewSettings(1024,768, true)'>iPad landscape</button>\n" +
    "    <button ng-tap='updatePreviewSettings(768, 1024, true)'>iPad portrait</button>\n" +
    "    <button ng-tap='updatePreviewSettings(568,320, true)'>iPhone5 landscape</button>\n" +
    "    <button ng-tap='updatePreviewSettings(320, 568, true)'>iPhone5 portrait</button>\n" +
    "    <button ng-tap='updatePreviewSettings(1024,748, false)'>iPad landscape iOS6</button>\n" +
    "    <button ng-tap='updatePreviewSettings(768, 1004, false)'>iPad portrait iOS6</button>\n" +
    "    <button ng-tap='updatePreviewSettings(568,300, false)'>iPhone5 landscape iOS6</button>\n" +
    "    <button ng-tap='updatePreviewSettings(320,548, false)'>iPhone5 portrait iOS6</button>\n" +
    "    <button ng-tap='reloadPreview()'>Reload</button>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-right-panel.html',
    "<div cjs-sidepanel=\"componentDefinition.popuptrigger\" ng-class=\"{active: componentDefinition.active}\">\n" +
    "<div ng-if=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\" ng-include=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\"></div>\n" +
    "<div ng-if=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" cjs-json-template=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" data=\"componentDefinition.data\"></div>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('cjs-shared-popup.html',
    "<div cjs-popup=\"componentDefinition.popuptrigger\" ng-class=\"{nativetransition: componentDefinition.nativeTransition}\">\n" +
    "<div ng-if=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\" ng-include=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\"></div>\n" +
    "<div ng-if=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" cjs-json-template=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" data=\"componentDefinition.data\"></div>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('cjs-tab-footer.html',
    "<div class=\"tabbar\" ng-show=\"componentDefinition.active\">\n" +
    "\n" +
    "    <button ng-repeat=\"tab in componentDefinition.data.buttons track by tab.value\"  ng-tap=\"setTab(tab.value)\" ng-class=\"{selected: tab.value == componentDefinition.selectedTab}\" class=\"icon-top icon-custom\"><div class=\"maskedicon\" ng-style=\"{'-webkit-mask-image': 'url('+tab.icon+')'}\"></div> {{tab.title}}</button>\n" +
    "\n" +
    "    \n" +
    "</div>"
  );

}]);

/* jshint devel: true, browser: true */

Chondric.VersionedDatabase = function(db, updatefunctions, tables) {

    this.sqlerror = function(t, err) {
        if (err && err.message) throw new Error(err.message);
        else if (t && t.message) throw new Error(t.message);
        else if (err) {
            throw new Error(err);
        } else if (t) {
            throw new Error(t);
        } else {
            throw new Error("sql error");
        }
    };
    var sqlerror = this.sqlerror;

    var getVersion = function(versionCallback) {
        console.log("checking version");

        db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM settings where key=?", ["dbVersion"], function(t, result) {
                if (result.rows.length === 0) return versionCallback(0);
                var row = result.rows[0] || result.rows.item(0);
                window.setTimeout(function() {
                    return versionCallback(parseFloat(row.val));
                }, 0);
            }, function() {
                // error - no db
                window.setTimeout(function() {
                    versionCallback(0);
                }, 0);
            });
        }, function() {
            // error - no db
            window.setTimeout(function() {
                versionCallback(0);
            }, 0);
        });
    };

    this.updateDatabase = function(callback) {



        getVersion(function(currentVersion) {
            console.log("Current database version is " + currentVersion);

            var existingversion = currentVersion;

            var versionQueue = [];

            for (var vn in updatefunctions) {
                var vv = parseFloat(vn);
                if (existingversion < vv) {
                    versionQueue.push(vn);
                }
            }

            if (versionQueue.length === 0) return callback();

            db.transaction(function(tx) {
                for (var vn in updatefunctions) {
                    var vv = parseFloat(vn);
                    if (existingversion < vv) {
                        updatefunctions[vn](tx);
                        tx.executeSql('INSERT OR REPLACE INTO settings (key, val) VALUES (?, ?)', ["dbVersion", vv], null, sqlerror);
                        existingversion = vv;
                    }
                }
            }, sqlerror, function() {
                callback();
            });
        });
    };


    this.dropDatabase = function(callback) {
        db.transaction(function(tx) {
            for (var tn in tables) {
                tx.executeSql("DROP TABLE " + tn, [], null, sqlerror);
            }
        }, sqlerror, function() {
            callback();
        });
    };

    this.resetDatabase = function(callback) {
        var that = this;
        this.dropDatabase(function() {
            that.updateDatabase(callback);
        });
    };

};
Chondric.directive('ngTap', function() {
    var lastTapLocation;
console.log("init tap");
    var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

    // set mouse/touch flag globally. This way a tap that hides the button won't cause a click that
    // triggers ng-tap on the button behind it.
window.useMouse = true;

    // todo: turn useMouse back on if a genuine mouse event shows up
    window.document.addEventListener('touchstart', function(event) {
        window.useMouse = false;
    }, true);

    // however, system elements such as dropdowns and text areas can still be triggered by the ghost click,
    // so we have this code to try and kill the click events created 300ms after a handled touch event.
    var cancelMouseEvent = function(event) {
        console.log("no last tap - event at " + event.screenY);
        if (!lastTapLocation) return;
        console.log("checking ghost click: "+lastTapLocation.y + " - " + event.screenY);
        if (Math.abs(event.screenX - lastTapLocation.x) < 25 && Math.abs(event.screenY - lastTapLocation.y) < 25) {

            // ie8 fix
            if (!event.stopPropagation) {
                event.stopPropagation = function() {
                    event.cancelBubble = true; //ie
                };
            }

            if (!event.preventDefault) {
                event.preventDefault = function() {
                    event.returnValue = false; //ie
                };
            }
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();


            // setting the focus here since node.setActive pulls up the keyboard anyway - may as well
            // have the input going somewhere valid.
            
            //event.target.focus();

        }
    };
    window.document.addEventListener('mouseup', function(event) {
        hideGhostClickCatcher();
    //    cancelMouseEvent(event);
    }, true);
    window.document.addEventListener('mousedown', function(event) {
        hideGhostClickCatcher();
    //    cancelMouseEvent(event);
    }, true);
    window.document.addEventListener('click', function(event) {
        hideGhostClickCatcher();
        if (window.jstimer) window.jstimer.finish("ghostclick");
    //    cancelMouseEvent(event);
    }, true);


    var ghostClickCatcher = $('<div style="background-color:rgba(0,0,0,0); position:absolute; top:0; bottom:0; left:0; right:0; z-index:12000; display:none;"></div>');
    $(document.body).append(ghostClickCatcher);
    ghostClickCatcher.on("mousedown", hideGhostClickCatcher);
    function showGhostClickCatcher() {
        // todo: probably should also adjust position to align with tap location
        // otherwise tapping elsewhere on the page is disabled unnecessarily.
         ghostClickCatcher.css( "display", "block" );
    }

    function hideGhostClickCatcher() {
        ghostClickCatcher.css( "display", "none" );
    }



    return function(scope, element, attrs) {
        element.addClass('tappable');

        var active = false;
        var touching = false;

        var startX = 0;
        var startY = 0;

        var touchTimeout = 0;

        // detect move and cancel tap if drag started
        var move = function(e) {
            var x = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.clientX;
            var y = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.clientY;
            if (Math.abs(x - startX) > 10 || Math.abs(y - startY) > 10) {
                cancel(e);
            }
        };

        // called if the mouse moves too much or leaves the element
        var cancel = function() {
           
            if (touchTimeout) window.clearTimeout(touchTimeout);

            if (!window.useMouse) {
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

        };

        // called when a tap is completed
        var action = function(e) {
            if (touchTimeout) window.clearTimeout(touchTimeout);

            if (e.originalEvent.handled) return;
            e.originalEvent.handled = true;

            if (e.originalEvent.changedTouches) {
                showGhostClickCatcher();
            }


            scope.lastTap = {
                element: element,
                x: e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].clientX : e.clientX,
                y: e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].clientY : e.clientY
            };
/*

            // ie8 fix
            if (!e.originalEvent.stopPropagation) {
                e.originalEvent.stopPropagation = function() {
                    e.originalEvent.cancelBubble = true; //ie
                };
            }

            if (!e.originalEvent.preventDefault) {
                e.originalEvent.preventDefault = function() {
                    e.originalEvent.returnValue = false; //ie
                };
            }

            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
*/
            if (!window.useMouse) {
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

            window.setTimeout(function() {
                scope.$apply(attrs.ngTap, element);
            }, 0);
        };

        function start(e) {

            startX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.clientX;
            startY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.clientY;

            element.addClass('active');
            element.removeClass('deactivated');
            active = true;
        }

        // called on mousedown or touchstart. Multiple calls are ignored.
        var mouseStart = function(e) {
            if (e.originalEvent.handled) return;
            e.originalEvent.handled = true;

            if (!window.useMouse) return;
            // cancel if we already handled this as a touch event
            if (lastTapLocation && Math.abs(event.screenX - lastTapLocation.x) < 25 && Math.abs(event.screenY - lastTapLocation.y) < 25) return;
            // because IE doesn't handle pointer-events properly 
            if (element.hasClass('disabled')) return;
            // left button only
            if (e.which != 1) return;
            if (active || touching) return;
            touching = false;

            window.useMouse = true;
            element.bind('mousemove', move);
            element.bind('mouseout', cancel);
            element.bind('mouseup', action);


            start(e);
        };

        var touchStart = function(e) {

            if (e.originalEvent.handled) return;
            e.originalEvent.handled = true;
            lastTapLocation = {
                x: e.originalEvent.touches[0].screenX,
                y: e.originalEvent.touches[0].screenY
            };

            touchTimeout = window.setTimeout(function() {
                touchTimeout = 0;
                cancel();
            }, 500);

            if (active) return;
            touching = true;
            if (window.jstimer) window.jstimer.start("ghostclick");
            window.useMouse = false;
            element.bind('touchmove', move);
            element.bind('touchend', action);

            start(e);
        };


        element.bind('touchstart', touchStart);
        element.bind('mousedown', mouseStart);
    };
});
Chondric.directive('cjsLoadingOverlay', function($templateCache, $compile) {
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, element, attrs) {
            var contentElement;
            if (element.children().length == 1) {
                contentElement = element.children().first();
            } else {
                contentElement = element.wrapInner("<div/>").children().first();
            }


            // get the contents of the element. If there is a single element, use it directly. if not, wrap it.
            var overlay;
            if (attrs.overlayType == "compact") {
                overlay = angular.element($templateCache.get("cjs-loading-overlay-compact.html"));
            } else if (attrs.overlayType == "simple") {
                overlay = angular.element($templateCache.get("cjs-loading-overlay-simple.html"));
            } else {
                overlay = angular.element($templateCache.get("cjs-loading-overlay.html"));
            }

            element.append(overlay);
            element.addClass("cjs-loading-overlay-container");
            $compile(overlay)(scope);


            function onUpdate(taskGroup) {
                scope.taskGroup = taskGroup;
                scope.currentTask = taskGroup.currentTask;
                if (taskGroup.completed) {
                    // finished                    
                    scope.message = "finished";
                    if (attrs.showUnloaded === undefined)
                        contentElement.addClass("ui-show").removeClass("ui-hide");
                    contentElement.addClass("cjs-loaded").removeClass("cjs-unloaded");
                    overlay.addClass("ui-hide").removeClass("ui-show");
                } else {
                    if (attrs.showUnloaded === undefined)
                        contentElement.addClass("ui-hide").removeClass("ui-show");
                    contentElement.addClass("cjs-unloaded").removeClass("cjs-loaded");
                    contentElement.addClass("cjs-unloaded")
                    overlay.addClass("ui-show").removeClass("ui-hide");
                    scope.title = taskGroup.title;
                    scope.error = taskGroup.error;
                    scope.message = taskGroup.message;
                }
            }
            scope.$watch("loadStatus", function(val) {
                if (!val) return;
                val.onUpdate(scope.$eval(attrs.cjsLoadingOverlay), onUpdate);
            })

        }
    };
});

Chondric.directive('cjsShowAfterLoad', function() {
    return {
        link: function(scope, element, attrs) {

            scope.loadStatus.onUpdate(scope.$eval(attrs.cjsShowAfterLoad), function(taskGroup) {
                if (taskGroup.completed) {
                    element.addClass("ui-show").removeClass("ui-hide");
                } else {
                    element.addClass("ui-hide").removeClass("ui-show");
                }
            });
        }
    };
});


Chondric.factory('loadStatus', function() {
    // simple UI to track loading status
    return {
        init: function($scope, tasks) {
            var service = {};
            var existing = $scope.loadStatus;
            if (existing) {
                $.extend(service, existing);
                service.allTasks = [].concat(existing.allTasks);

            } else {
                service.allTasks = [];
            }
            $scope.loadStatus = service;

            service.registerTask = function(key, taskOptions) {
                var task = {
                    key: key,
                    title: "Untitled Task",
                    progressCurrent: 0,
                    progressTotal: 1,
                    active: false,
                    message: "Message Here...",
                    error: null,
                    start: function() {
                        task.active = true;
                        task.error = null;
                        task.progressCurrent = 0;
                    },
                    finish: function() {
                        task.progressCurrent = task.progressTotal;
                        task.completed = true;
                        task.active = false;
                    },
                    fail: function(message) {
                        task.active = false;
                        task.error = message;
                    },
                    progress: function(progress, total, message) {
                        task.active = true;
                        task.progressCurrent = progress;
                        if (total !== undefined) task.progressTotal = total;
                        if (message !== undefined) task.message = message;
                    }
                };
                $.extend(task, taskOptions);
                service[key] = task;
                service.allTasks.push(task);
            };

            service.onUpdate = function(tasksOrKeys, fn) {
                // if no task array specified, include all tasks in the current scope
                tasksOrKeys = tasksOrKeys || service.allTasks;
                var watchedKeys = [];
                for (var i = 0; i < tasksOrKeys.length; i++) {
                    var t = tasksOrKeys[i];
                    if (typeof t == "string") watchedKeys.push(t);
                    else if (t.key) watchedKeys.push(t.key);
                }
                if (watchedKeys.length === 0) return fn({
                    tasks: [],
                    completed: true
                });

                $scope.$watch("[loadStatus." + watchedKeys.join(",loadStatus.") + "]", function(tasks) {
                    // check all tasks, see if there are any outstanding
                    if (!tasks) return;

                    var result = {
                        tasks: tasks
                    };

                    result.currentTask = undefined;
                    for (var i = 0; i < tasks.length; i++) {
                        var task = tasks[i];
                        if (task.error) {
                            result.currentTask = task;
                            break;
                        }

                        if (task.active) {
                            result.currentTask = task;
                            break;
                        }
                        if (task.progressCurrent < task.progressTotal && (!result.currentTask || task.progressTotal > result.currentTask.progressTotal)) {
                            result.currentTask = task;
                            break;
                        }
                    }
                    if (!result.currentTask) {
                        // finished                    
                        result.message = "finished";
                        result.completed = true;
                    } else {
                        result.completed = false;
                        result.title = result.currentTask.title;
                        result.error = result.currentTask.error;
                        result.message = result.currentTask.message || (result.currentTask.progressCurrent + " / " + result.currentTask.progressTotal);
                    }

                    fn(result);

                }, true);

            };

            service.after = function(tasksOrKeys, fn) {
                service.onUpdate(tasksOrKeys, function(taskGroup) {
                    if (taskGroup.completed) return fn();
                });
            };

            if (tasks) {
                for (var tk in tasks) {
                    service.registerTask(tk, tasks[tk]);
                }
            }
            return service;
        }
    };
});
Chondric.directive("cjsPopover", function() {
    return {

        //        restrict: "E",
        link: function(scope, element, attrs) {
            var useOverlay = attrs.noOverlay === undefined;
            var horizontal = attrs.horizontal !== undefined;
            var menuwidth = parseFloat(attrs.menuwidth) || 280;
            var menuheight = parseFloat(attrs.menuheight) || 150;

            element.addClass("modal");
            element.addClass("popover");

            function clickOutsidePopup(e) {
                var r = element[0].getBoundingClientRect();
                var x = e.changedTouches ? e.changedTouches[0].clientX : e.touches ? e.touches[0].clientX : e.clientX;
                var y = e.changedTouches ? e.changedTouches[0].clientY : e.touches ? e.touches[0].clientY : e.clientY;
                if (x > r.left && x < r.right && y > r.top && y < r.bottom) return;
                scope.$apply("hideModal('" + attrs.cjsSidepanel + "')");
            }


            function ensureOverlay(element, useOverlay) {
                var parentPageElement = element.closest(".chondric-page");
                if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-section");
                if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-viewport");
                if (useOverlay) {
                    var overlay = $(".modal-overlay", parentPageElement);
                    if (overlay.length === 0) {
                        overlay = angular.element('<div class="modal-overlay"></div>');
                        parentPageElement.append(overlay);
                    }
                    return overlay;
                }
            }

            scope.$watch(attrs.cjsPopover, function(val) {
                if (document.activeElement && useOverlay && !window.NativeNav && document.activeElement.tagName != "BODY") document.activeElement.blur();
                var overlay = ensureOverlay(element, useOverlay);

                if (!val) {
                    if (useOverlay) {
                        overlay.removeClass("active");
                    }
                    element.removeClass("active");
                    window.document.body.removeEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                } else {
                    window.document.body.addEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                    menuheight = element.height() || menuheight;
                    menuwidth = element.width() || menuwidth;

                    var menupos = {};
                    // TODO: should get actual size of the element, but it is display: none at this point.

//                    var sw = element[0].offsetParent.offsetWidth;
//                    var sh = element[0].offsetParent.offsetHeight;

    var parentRect = element[0].offsetParent.getBoundingClientRect();

                    var sw = $(document).width();
                    var sh = $(document).height();



                    var horizontalCutoff = sw / 2;
                    var verticalCutoff = sh / 2;
                    var idealX = 0;
                    var idealY = 0;


                    if (val.element && val.element[0]) {
                        var button = val.element[0];
                        var cr = button.getBoundingClientRect();

                        if (horizontal) {
                            // x at left or right of button, y center of button
                            if (cr.right > horizontalCutoff) {
                                idealX = cr.right;
                            } else {
                                idealX = cr.left;
                            }
                            idealY = cr.top + cr.height / 2;
                        } else {
                            // x at center of button, y at left or right of button
                            idealX = cr.left + cr.width / 2;
                            if (cr.bottom > verticalCutoff) {
                                idealY = cr.top;
                            } else {
                                idealY = cr.bottom;
                            }
                        }

                    } else {
                        idealX = val.x || 0;
                        idealY = val.y || 0;
                    }

                    var actualX = idealX;
                    var actualY = idealY;
                    // adjust position to ensure menu remains onscreen
                    if (horizontal) {
                        if (idealY - 10 - menuheight / 2 < 0) actualY = menuheight / 2 + 10;
                        if ((idealY + 10 + menuheight / 2) > sh) actualY = sh - menuheight / 2 - 10;
                    } else {
                        if (idealX - 10 - menuwidth / 2 < 0) actualX = menuwidth / 2 + 10;
                        if ((idealX + 10 + menuwidth / 2) > sw) actualX = sw - menuwidth / 2 - 10;
                    }

                    if (horizontal) {
                        if (actualX < horizontalCutoff) {
                            menupos.left = (actualX + 13 - parentRect.left) + "px";
                            menupos.right = "auto";
                            element.addClass("right").removeClass("left");
                        } else {
                            menupos.right = (parentRect.right - actualX + 13) + "px";
                            menupos.left = "auto";
                            element.addClass("left").removeClass("right");
                        }
                        menupos.top = (actualY - menuheight / 2 - parentRect.top) + "px";
                    } else {
                        if (actualY < verticalCutoff) {
                            menupos.top = (actualY + 13 - parentRect.top) + "px";
                            menupos.bottom = "auto";
                            element.addClass("down").removeClass("up");
                        } else {
                            menupos.bottom = (parentRect.bottom - actualY + 13) + "px";
                            menupos.top = "auto";
                            element.addClass("up").removeClass("down");
                        }
                        menupos.left = (actualX - menuwidth / 2 - parentRect.left) + "px";
                    }

                    /* 

                        if (cr.bottom > sh / 2) {
                            menupos.bottom = (sh - cr.top + 12) + "px";
                            menupos.top = "auto";
                            
                        } else {
                            menupos.top = (cr.bottom + 12) + "px";
                            menupos.bottom = "auto";
                            element.addClass("down").removeClass("up");
                        }
                        var left = ((button.offsetLeft + button.offsetWidth / 2) - menuwidth / 2);
                        var arrowleft = (cr.left + cr.width / 2) - 13 - left;

*/

                    var indel = $(".poparrow", element);
                    if (indel.length > 0) {
                        if (horizontal) {
                            var arrowtop = idealY - (actualY - menuheight / 2) - 13;
                            if (arrowtop < 10) arrowtop = 10;
                            if (arrowtop + 26 > menuheight - 10) arrowtop = menuheight - 10 - 26;
                            indel.css("top", arrowtop + "px");
                        } else {
                            var arrowleft = idealX - (actualX - menuwidth / 2) - 13;
                            if (arrowleft < 10) arrowleft = 10;
                            if (arrowleft + 26 > menuwidth - 10) arrowleft = menuwidth - 10 - 26;
                            indel.css("left", arrowleft + "px");

                        }
                    }
                    if (useOverlay) {
                        overlay.addClass("active");
                    }
                    element.addClass("active");
                    element.css(menupos);
                }
            });
        }
    };
});
Chondric.directive("cjsPopup", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {


            function clickOutsidePopup(e) {
                var r = element[0].getBoundingClientRect();
                var x = e.changedTouches ? e.changedTouches[0].clientX : e.touches ? e.touches[0].clientX : e.clientX;
                var y = e.changedTouches ? e.changedTouches[0].clientY : e.touches ? e.touches[0].clientY : e.clientY;
                if (x > r.left && x < r.right && y > r.top && y < r.bottom) return;
                scope.$apply("hideModal('" + attrs.cjsSidepanel + "')");
            }


            element.addClass("modal");
            element.addClass("popup");

            var parentPageElement = element.closest(".chondric-page");
            if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-section");
            if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-viewport");
            var overlay = $(".modal-overlay", parentPageElement);
            if (overlay.length === 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                parentPageElement.append(overlay);
            }

            scope.$watch(attrs.cjsPopup, function(val) {
                if (document.activeElement && !window.NativeNav && document.activeElement.tagName != "BODY") document.activeElement.blur();
                if (element.hasClass("nativetransition")) {
                    if (!val) {
                        element.removeClass("active");
                    } else {
                        element.addClass("active");
                    }

                } else {
                    if (!val) {
                        overlay.removeClass("active");
                        element.removeClass("active");
                        window.document.body.removeEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                    } else {
                        window.document.body.addEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);

                        overlay.addClass("active");
                        element.addClass("active");
                        if (val.additionalClasses) element.addClass(val.additionalClasses);

                    }

                }
            });
        }
    };
});

// todo: remopve this once transitions are fully implemented
/* jshint unused: false */

Chondric.directive("cjsSidepanel", function() {

    var panelTransitions = {
        revealRight: {
            init: function(panel, page, overlay) {
                // set initial position
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
            },
            reset: function(panel, page, overlay) {
                // remove custom css
            }
        },
        coverRight: {
            init: function(panel, page, overlay) {
                // set initial position
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "none",
                    "opacity": "0"
                });
                panel.css({
                    "right": 0,
                    "left": "auto",
                    "display": "block",
                    "-webkit-transition": "none",
                    "-webkit-transform": "translate(" + (spwidth) + "px, 0)"
                });
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "none",
                    "opacity": (progress * 0.3)
                });
                panel.css({
                    "right": 0,
                    "left": "auto",
                    "display": "block",
                    "-webkit-transition": "none",
                    "-webkit-transform": "translate(" + (spwidth - progress * spwidth) + "px, 0)"
                });
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
                var time = (prevProgress) * 300;
                if (time === 0) return 0;
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "opacity " + time + "ms ease-in-out",
                    "opacity": "0"
                });
                panel.css({
                    "display": "block",
                    "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                    "-webkit-transform": "translate(" + (spwidth) + "px, 0)"
                });
                return time;
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
                var time = (1 - prevProgress) * 300;
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "opacity " + time + "ms ease-in-out",
                    "opacity": "0.3"
                });
                panel.css({
                    "display": "block",
                    "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                    "-webkit-transform": "translate(" + 0 + "px, 0)"
                });
                return time;
            },
            reset: function(panel, page, overlay) {
                // remove custom css
                overlay.css({
                    "visibility": "",
                    "-webkit-transition": "",
                    "opacity": ""
                });
                panel.css({
                    "display": "",
                    "-webkit-transition": "",
                    "-webkit-transform": "",
                    // keep position because there isn't a reasonable default
                    "right": 0,
                    "left": "auto"
                });
            }
        },
        slideRight: {
            init: function(panel, page, overlay) {
                // set initial position
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
            },
            reset: function(panel, page, overlay) {
                // remove custom css
            }
        },
        revealLeft: {
            init: function(panel, page, overlay) {
                // set initial position
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
            },
            reset: function(panel, page, overlay) {
                // remove custom css
            }
        },
        coverLeft: {
            init: function(panel, page, overlay) {
                // set initial position
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "none",
                    "opacity": "0"
                });
                panel.css({
                    "left": 0,
                    "right": "auto",
                    "display": "block",
                    "-webkit-transition": "none",
                    "-webkit-transform": "translate(" + (-spwidth) + "px, 0)"
                });
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "none",
                    "opacity": (progress * 0.3)
                });
                panel.css({
                    "left": 0,
                    "right": "auto",
                    "display": "block",
                    "-webkit-transition": "none",
                    "-webkit-transform": "translate(" + (-spwidth + progress * spwidth) + "px, 0)"
                });
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
                var time = (prevProgress) * 300;
                if (time === 0) return 0;
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "opacity " + time + "ms ease-in-out",
                    "opacity": "0"
                });
                panel.css({
                    "display": "block",
                    "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                    "-webkit-transform": "translate(" + (-spwidth) + "px, 0)"
                });
                return time;
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
                var time = (1 - prevProgress) * 300;
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "opacity " + time + "ms ease-in-out",
                    "opacity": "0.3"
                });
                panel.css({
                    "display": "block",
                    "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                    "-webkit-transform": "translate(" + 0 + "px, 0)"
                });
                return time;
            },
            reset: function(panel, page, overlay) {
                // remove custom css
                overlay.css({
                    "visibility": "",
                    "-webkit-transition": "",
                    "opacity": ""
                });
                panel.css({
                    "display": "",
                    "-webkit-transition": "",
                    "-webkit-transform": "",
                    // keep position because there isn't a reasonable default
                    "left": 0,
                    "right": "auto"
                });
            }
        },
        slideLeft: {
            init: function(panel, page, overlay) {
                // set initial position
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
            },
            reset: function(panel, page, overlay) {
                // remove custom css
            }
        }
    };

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {


            function clickOutsidePopup(e) {
                var r = element[0].getBoundingClientRect();
                var x = e.changedTouches ? e.changedTouches[0].clientX : e.touches ? e.touches[0].clientX : e.clientX;
                var y = e.changedTouches ? e.changedTouches[0].clientY : e.touches ? e.touches[0].clientY : e.clientY;
                if (x > r.left && x < r.right && y > r.top && y < r.bottom) return;
                scope.$apply("hideModal('" + attrs.cjsSidepanel + "')");
            }

            element.addClass("modal");
            element.addClass("sidepanel");

            var pushmode;

            if (!element.hasClass("left")) {
                element.addClass("right");
                if (element.hasClass("push")) pushmode = "left";
            } else {
                if (element.hasClass("push")) pushmode = "right";
            }



            var parentPageElement = element.closest(".chondric-page");
            if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-section");
            if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-viewport");
            var overlay = $(".modal-overlay", parentPageElement);
            if (overlay.length === 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                parentPageElement.append(overlay);
            }

            if (pushmode) {
                parentPageElement.addClass("haspushpanel");
            }


            scope.$watch(attrs.cjsSidepanel, function(val, oldval) {
                if (!val && !oldval) return;
                if (document.activeElement && !window.NativeNav && document.activeElement.tagName != "BODY" && (((val && !oldval) || !(val && oldval)) || val.progress != oldval.progress)) {
                    document.activeElement.blur();
                }
                var transition = "coverRight";
                var progress = 0;
                var oldprogress = 0;
                var spwidth = element.width() || 200;
                var dwidth = $(document).width();

                if (val && val.transition) transition = val.transition;
                else if (oldval && oldval.transition) transition = oldval.transition;

                if (val && val.progress) {
                    // progress will be % of screen width
                    // convert back to px and make 100% at side panel width
                    progress = Math.min(1, val.progress * dwidth / spwidth);
                } else {
                    progress = 0;
                }
                if (oldval && oldval.progress) {
                    // progress will be % of screen width
                    // convert back to px and make 100% at side panel width
                    oldprogress = Math.min(1, oldval.progress * dwidth / spwidth);
                } else {
                    oldprogress = 0;
                }

                if (progress == 1) {
                    overlay.addClass("active");
                    window.document.body.addEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);

                    if (!oldprogress) {
                        // ensure initial position was set
                        panelTransitions[transition].init(element, parentPageElement, overlay);
                    }
                    window.setTimeout(function() {
                        var time = panelTransitions[transition].complete(element, parentPageElement, overlay, oldprogress);
                    }, 0);

                } else if (progress === 0) {
                    var time = panelTransitions[transition].cancel(element, parentPageElement, overlay, oldprogress);
                    window.setTimeout(function() {
                        panelTransitions[transition].reset(element, parentPageElement, overlay);
                    }, time);
                    overlay.removeClass("active");
                    window.document.body.removeEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                } else {
                    panelTransitions[transition].progress(element, parentPageElement, overlay, progress);
                    overlay.addClass("active");
                    window.document.body.addEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                }

            });
        }
    };
});
Chondric.directive("cjsSwipe", function() {

    return {
        //        restrict: "E",
        link: function(scope, element) {
            if (window.NativeNav) return;
            var useMouse = true;
            var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
            if (iOS) {
                useMouse = false;
            }

            var startX = 0;
            var startY = 0;
            var threshold = 20;
            var dx = 0;
            var dy = 0;
            var width = 0;
            var height = 0;
            var swipeState = {
                left: 0,
                right: 0,
                up: 0,
                down: 0,
                leftborder: 0,
                rightborder: 0,
                topborder: 0,
                bottomborder: 0
            };
            var tracking = false;

            var updateSwipe = scope.$eval("updateSwipe");
            var endSwipe = scope.$eval("endSwipe");

            var swipeNav;

            element.on(useMouse ? "mousedown" : "touchstart", function(e) {
                if (tracking) return;
                tracking = true;
                if (e.originalEvent.changedTouches) {
                    startX = e.originalEvent.changedTouches[0].clientX;
                    startY = e.originalEvent.changedTouches[0].clientY;
                } else {
                    startX = e.clientX;
                    startY = e.clientY;
                }
                dx = 0;
                dy = 0;
                width = element.width();
                height = element.height();

                swipeState = {
                    left: 0,
                    right: 0,
                    up: 0,
                    down: 0,
                    leftBorder: 0,
                    rightBorder: 0,
                    topBorder: 0,
                    bottomBorder: 0
                };

                $(document).on(useMouse ? "mousemove" : "touchmove", move);
                $(document).on(useMouse ? "mouseup" : "touchend", end);

                swipeNav = scope.$eval("swipeNav");

            });

            function move(e) {

                if (e.originalEvent.changedTouches) {
                    dx = e.originalEvent.changedTouches[0].clientX - startX;
                    dy = e.originalEvent.changedTouches[0].clientY - startY;
                } else {
                    dx = e.clientX - startX;
                    dy = e.clientY - startY;
                }

                if (swipeState.left) swipeState.left = Math.max(0, -dx / width);
                else if (swipeState.right) swipeState.right = Math.max(0, dx / width);
                else if (swipeState.leftBorder) swipeState.leftBorder = Math.max(0, dx / width);
                else if (swipeState.rightBorder) swipeState.rightBorder = Math.max(0, -dx / width);
                else if (swipeState.up) swipeState.up = Math.max(0, -dy / height);
                else if (swipeState.down) swipeState.down = Math.max(0, dy / height);
                else if (swipeState.topBorder) swipeState.topBorder = Math.max(0, dy / height);
                else if (swipeState.bottomBorder) swipeState.bottomBorder = Math.max(0, -dy / height);
                else {
                    // starting a new swipe
                    if (dx > threshold && Math.abs(dy) < threshold) {
                        if (startX < 10) swipeState.leftBorder = dx / width;
                        else swipeState.right = dx / width;
                    } else if (-dx > threshold && Math.abs(dy) < threshold) {
                        if (startX > width - 10) swipeState.rightBorder = -dx / width;
                        else swipeState.left = -dx / width;
                    } else if (dy > threshold && Math.abs(dx) < threshold) {
                        if (startY < 10) swipeState.topBorder = dy / height;
                        else swipeState.down = dy / height;
                    } else if (-dy > threshold && Math.abs(dx) < threshold) {
                        if (startY > height - 10) swipeState.bottomBorder = -dy / height;
                        else swipeState.up = -dy / height;
                    }
                }

                if (updateSwipe) updateSwipe(swipeState, swipeNav, scope);

            }

            function end() {
                if (!tracking) return;
                tracking = false;
                $(document).off(useMouse ? "mousemove" : "touchmove", move);
                $(document).off(useMouse ? "mouseup" : "touchend", end);

                if (endSwipe) endSwipe(swipeState, swipeNav, scope);

                swipeState = {
                    left: 0,
                    right: 0,
                    up: 0,
                    down: 0,
                    leftBorder: 0,
                    rightBorder: 0,
                    topBorder: 0,
                    bottomBorder: 0
                };

            }


        }
    };
});

Chondric.directive("cjsTransitionStyle", function() {

    return {
        //        restrict: "E",
        link: function($scope, element, attrs) {
            $scope.$watch('transition', function(transition, old) {
                //                console.log("transition: ", transition);
                //                console.log("old: ", old);
                if (!transition) return;
                var td = Chondric.allTransitions[transition.type];
                if (!td) return;

                var isNewTransition = !old || transition.from != old.from || transition.to != old.to || (old.progress === 0 || old.progress == 1);
                var time;
                if (attrs.route == transition.to) {
                    // apply styles to next page
                    if (transition.progress === 0 && isNewTransition) {
                        // set initial style
                        td.transitionIn.start(element);
                    } else if (transition.progress === 0 && !isNewTransition) {
                        // existing transition cancelled - reset to initial state and remove styles after timeout
                        time = td.transitionIn.cancel(element, old.progress);
                        window.setTimeout(function() {
                            td.reset(element);
                        }, time);
                    } else if (transition.progress == 1) {
                        // transition completed - set page as active and remove styles after timeout.
                        // transition function returns time in milliseconds
                        time = td.transitionIn.complete(element, old.progress);
                        window.setTimeout(function() {
                            td.reset(element);
                        }, time);
                    } else {
                        // intermediate progress - set positions without transition.
                        td.transitionIn.progress(element, transition.progress);
                    }

                } else if (attrs.route == transition.from) {
                    // apply styles to prev page
                    if (transition.progress === 0 && isNewTransition) {
                        // set initial style
                        td.transitionOut.start(element);
                    } else if (transition.progress === 0 && !isNewTransition) {
                        // existing transition cancelled - reset to initial state and remove styles after timeout
                        time = td.transitionOut.cancel(element, old.progress);
                        window.setTimeout(function() {
                            td.reset(element);
                        }, time);
                    } else if (transition.progress == 1) {
                        // transition completed - set page as active and remove styles after timeout.
                        // transition function returns time in milliseconds
                        time = td.transitionOut.complete(element, old.progress);
                        window.setTimeout(function() {
                            td.reset(element);
                        }, time);
                    } else {
                        // intermediate progress - set positions without transition.
                        td.transitionOut.progress(element, transition.progress);
                    }
                }

            }, true);
        }
    };
});
Chondric.directive("cjsPreviewControls", function() {

    return {
        restrict: "AE",
        replace: true,
        templateUrl: "cjs-preview-controls.html",
        link: function(scope) {
            scope.previewSettings = {
                width: 1024,
                height: 768,
                overlayStatusBar: true
            };
            scope.reloadPreview = function() {
                document.getElementById("preview").contentDocument.location.reload(true);
            };
            scope.updatePreviewSettings = function(w, h, overlayStatusBar) {
                scope.previewSettings = {
                    width: w,
                    height: h,
                    overlayStatusBar: overlayStatusBar
                };
            };
        }
    };
});
Chondric.directive('chondricViewport', function($compile) {
    return {
        scope: true,
        link: function(scope, element, attrs) {
            //            console.log("viewport directive");
            var rk = scope.$eval("rk");
            var rv = scope.$eval("rv");
            if (rv) {
                scope.pageParams = rv.params || {};
                // add route parameters directly to the scope
                for (var k in rv.params) {
                    scope[k] = rv.params[k];
                }
            }
            if (rk) scope.pageRoute = rk;

            if (!rk && attrs["chondric-viewport"] == "1") return;

            var template = "";
            if (!rv) {
                // first level
                element.addClass("chondric-viewport");
                //                template = "<div class=\"chondric-viewport\">"
                template = "<div ng-repeat=\"(rk, rv) in openViews track by rk\" chondric-viewport=\"1\" class=\"{{rv.templateId}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute}\" cjs-transition-style route=\"{{rk}}\">";
                template += "</div>";
                template += "<div ng-repeat=\"(ck, componentDefinition) in sharedUiComponents track by ck\" cjs-shared-component testattr='{{componentId}}'>";
                template += "</div>";

                //                template += "</div>"

            } else if (rv.isSection) {
                template = "<div ng-controller=\"rv.controller\" >";
                template += "<div ng-repeat=\"(rk, rv) in rv.subsections track by rk\" chondric-viewport=\"1\" class=\"{{rv.templateId}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute}\" cjs-transition-style route=\"{{rk}}\">";
                template += "</div>";
                template += "</div>";

            } else if (rv.templateUrl) {
                template = "<div  ng-controller=\"rv.controller\" cjs-swipe class=\"{{usedComponents.asString}}\"> <div ng-include src=\"rv.templateUrl\"></div>";
                template += '</div>';
                scope.usedComponents = {
                    asArray: [],
                    asString: ""
                };

            } else {
                template = "<span>Template not set</span>";
            }

            var newElement = angular.element(template);
            $compile(newElement)(scope);
            element.html("");
            element.append(newElement);
        }
    };
});

Chondric.directive('cjsSharedComponent', function($compile) {
    return {
        scope: true,
        link: function(scope, element) {
            var cd = scope.componentDefinition;
            // no need to create html elements when using the native implementation
            if (cd.isNative && cd.isNative()) return;
            element.addClass("sharedcomponent-" + cd.id);
            var template = "";
            template += "<div ng-if='!componentDefinition.isNative()' ng-controller=\"componentDefinition.controller\" >";
            if (cd.template) {
                template += cd.template;
            } else if (cd.templateUrl) {
                template += "<div ng-include src=\"componentDefinition.templateUrl\"></div>";
            }
            template += "</div>";

            var newElement = angular.element(template);
            $compile(newElement)(scope);
            element.html("");
            element.append(newElement);
        }
    };
});
Chondric.directive("cjsJsonTemplate", function($compile) {

    var templates = {
        container: function(template) {
            var html = "";
            for (var i = 0; i < template.children.length; i++) {
                html += templates[template.children[i].type](template.children[i]);
            }
            return html;
        },
        body: function(template) {
            var html = "";
            for (var i = 0; i < template.children.length; i++) {
                html += templates[template.children[i].type](template.children[i]);
            }
            return "<div class='body'>" + html + "</div>";
        },
        h2: function(template) {
            return "<h2>{{data." + template.data + "}}</h2>";
        },
        p: function(template) {
            return "<p>{{data." + template.data + "}}</p>";
        }
    };


    return {

        //        restrict: "E",
        template: "Testing a template...",
        scope: {
            template: "=cjsJsonTemplate"
        },
        link: function(scope, element, attrs) {

            var template = scope.template;
            var html = templates[template.type](template);
            var newElement = angular.element(html);
            $compile(newElement)(scope);
            element.html("");
            element.append(newElement);

            scope.$parent.$watch(attrs.data, function(val) {
                scope.data = val;
            });
        }
    };
});
Chondric.registerSharedUiComponent({
    id: "cjs-action-sheet",
    templateUrl: "cjs-action-sheet.html",
    isNative: function() {
        return window.NativeNav;
    },
    controller: function($scope) {
        var self = $scope.componentDefinition;
        $scope.hideModal = function() {
            self.popuptrigger = null;
            var routeScope = self.app.scopesForRoutes[self.route];
            // need to reset this so the popup doesnt reopen if the page is reactivated.
            self.app.setSharedUiComponentState(routeScope, "cjs-action-sheet", false, true, null);
        };
        $scope.handleSharedPopupButtonClick = function(b) {
            self.popuptrigger = null;
            var routeScope = self.app.scopesForRoutes[self.route];
            self.app.setSharedUiComponentState(routeScope, "cjs-action-sheet", false, true, null);
            if (routeScope && b.action) {
                routeScope.$eval(b.action);
            }
        };
    },
    setState: function(self, route, active, available, data) {
        self.data = data;
        self.route = route;

        if (window.NativeNav) {
            if (active && data.element && data.element.length > 0) {
                var rect = data.element[0].getBoundingClientRect();
                window.NativeNav.showPopupMenu(route, rect.left, rect.top, rect.width, rect.height, data.items);
            }
        } else {
            if (!active) {
                self.popuptrigger = null;
            } else {
                self.popuptrigger = {
                    element: data.element
                };
            }
        }
    }
});
Chondric.registerSharedUiComponent({
    id: "cjs-multistate-component",
    updateTransitionSettings: function(self, thisState, otherState, position, isActivating) {
        // set fields for individual components
        // position will be 0 for active, -1 or +1 for inactive depending on transition direction
        thisState.isActivating = isActivating;
        thisState.text = "Active? " + isActivating;
    },
    updateCurrentState: function(self, state, active, available, data) {

    },
    chooseState: function(self, route, active, available, data) {
        for (var i = 0; i < self.states.length; i++) {
            if (self.states[i].route == route) return self.states[i];
        }
        for (var i = 0; i < self.states.length; i++) {
            if (self.states[i] != self.activeState) return self.states[i];
        }
    },
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.scope = $scope;
        self.states = [{
            route: null,
            available: false,
            active: false,
            data: null
        }, {
            route: null,
            available: false,
            active: false,
            data: null
        }];
        self.activeState = null;
    },
    setState: function(self, route, active, available, data, direction) {
        //        console.log(self.id + ".setState(" + route + "," + active + "," + available + "," + data + "," + direction + ")");
        //        console.log(data);

        if (!data || !Object.keys(data).length) {
            //   console.log("navbar setState - no data");
        }


        if (!self.initialTransitionTimeout && !active && !available && (!data || !Object.keys(data).length)) {
            self.initialTransitionTimeout = window.setTimeout(function() {
                self.setState(self, route, active, available, data, direction);
                self.scope.$apply();
            }, 100);
            return;
        }
        window.clearTimeout(self.initialTransitionTimeout);

        var state = self.chooseState(self, route, active, available, data);
        state.route = route;
        state.active = active;
        state.available = available;
        state.data = data;

        if (self.isNative && self.isNative() && self.setNativeState) {
            //   console.log("native")
            self.setNativeState(self, route, active, available, data, direction);
        } else if (state == self.activeState) {
            // in place update - no animation
            //    console.log("in place");
            self.updateCurrentState(self, state, active, available, data);
        } else {
            //    console.log("new state");

            var otherState = self.states[((self.states.indexOf(state)) + 1) % self.states.length];
            self.updateTransitionSettings(self, state, otherState, 0, true);
            self.updateTransitionSettings(self, otherState, state, direction > 0 ? 1 : -1, false);
            self.activeState = state;
        }
    }
});

Chondric.registerSharedUiComponent({
    id: "cjs-navigation-bar",
    templateUrl: "cjs-navigation-bar.html",
    baseComponentId: "cjs-multistate-component",
    isNative: function() {
        return (window.NativeNav && true) || false;
    },
    updateTransitionSettings: function(self, thisState, otherState, position, isActivating) {
        // console.log("navbar updateTransitionSettings - " + isActivating);
        //        console.log(thisState);
        // set fields for individual components
        // position will be 0 for active, -1 or +1 for inactive depending on transition direction
        thisState.isActivating = isActivating;
        thisState.text = "Active? " + isActivating;
        if (isActivating) {
            if (thisState.available) {
                if (!otherState.available) {
                    thisState.translateY = -80 * (Math.abs(position));
                } else {
                    thisState.translateY = 0;
                }
            } else {
                thisState.translateY = -80;
            }
            thisState.opacity = 1;
        } else {
            thisState.opacity = 0;
        }
    },
    updateCurrentState: function(self, state, active, available, data) {},
    setNativeState: function(self, route, active, available, data) {
        if (window.NativeNav) {
            window.NativeNav.showNavbar(route, active, data.leftButtons, data.title, data.rightButtons, data.titleChanged);
        }
    },
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.baseController("cjs-multistate-component", $scope);

        self.scope = $scope;
        $scope.globalHeaderOptions = self.globalHeaderOptions = {};

        $scope.handleSharedHeaderButtonClick = function(state, b, lastTap) {
            var routeScope = self.app.scopesForRoutes[state.route];
            if (routeScope && b.action) {
                routeScope.$eval(b.action);
            } else if (routeScope && b.items) {

                self.app.setSharedUiComponentState(routeScope, "cjs-action-sheet", true, true, {
                    element: lastTap.element,
                    items: b.items
                });
            }
        };

        $scope.titleChanged = function(state) {
            var routeScope = self.app.scopesForRoutes[state.route];
            if (routeScope && state.data.titleChanged) {
                routeScope.$eval(state.data.titleChanged)(state.data.title);
            }
        };
    }
    /*
    setStatePartial: function(self, initialState, finalState, progress) {
        if (!self.globalHeaderOptions) return;
        var v1 = self.globalHeaderOptions.v1;
        if (v1 && v1.route == initialState.route) {
            self.globalHeaderOptions.v1 = initialState;
            self.globalHeaderOptions.v2 = finalState;
            self.globalHeaderOptions.transitionState = progress;
        } else {
            self.globalHeaderOptions.v2 = initialState;
            self.globalHeaderOptions.v1 = finalState;
            self.globalHeaderOptions.transitionState = 1 - progress;
        }
        if (progress < 0.5) {
            self.route = initialState.route;
            self.data = initialState.data;
        } else {
            self.route = finalState.route;
            self.data = finalState.data;
        }


    },
    */
    /*
    setState2: function(self, route, active, available, data) {
        if (!self.globalHeaderOptions) return;

        self.route = route;
        self.data = data;

        if (window.NativeNav) {
            window.NativeNav.showNavbar(route, active, data.leftButtons, data.title, data.rightButtons, data.titleChanged);
        } else {
            var v1 = self.globalHeaderOptions.v1;
            if (v1 && v1.route == route) {
                self.globalHeaderOptions.v1 = {
                    route: route,
                    active: active,
                    available: available,
                    data: data
                };
                self.globalHeaderOptions.transitionState = 0;
            } else {
                self.globalHeaderOptions.v2 = {
                    route: route,
                    active: active,
                    available: available,
                    data: data
                };
                self.globalHeaderOptions.transitionState = 1;
            }
        }

    }*/
});
Chondric.registerSharedUiComponent({
    id: "cjs-tab-footer",
    templateUrl: "cjs-tab-footer.html",
    isNative: function() {
        return window.NativeNav && true || false;
    },
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.scope = $scope;
        $scope.componentId = self.id;

        $scope.setTab = function(val) {
            self.selectedTab = val;
            var routeScope = self.app.scopesForRoutes[self.route];
            if (routeScope) {
                routeScope.$eval(self.data.setTab || "setTab")(val);
            }
        };
    },
    setState: function(self, route, active, available, data) {
        self.data = data;
        self.route = route;
        self.active = active;
        self.available = available;
        self.selectedTab = data.selectedTab;

        if (window.NativeNav) {
            window.NativeNav.showTabbar(route, active, data.buttons, data.selectedTab);
        }
    }

});
Chondric.registerSharedUiComponent({
    id: "cjs-shared-popup",
    templateUrl: "cjs-shared-popup.html",
    isNative: function() {
        return false;
        //return (window.NativeNav && true) || false;
    },
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.scope = $scope;
        self.defaultController = function() {};

        $scope.hideModal = function() {
            var routeScope = self.app.scopesForRoutes[self.route];
            if (self.data.closeCallback) {
                routeScope.$eval(self.data.closeCallback)(self.data);
            }

            // need to reset this so the popup doesnt reopen if the page is reactivated.
            self.app.setSharedUiComponentState(routeScope, "cjs-shared-popup", false, true, self.data);
        };
        $scope.runOnMainScope = function(funcName, params) {
            var routeScope = self.app.scopesForRoutes[self.route];
            if (routeScope) {
                routeScope.$eval(funcName).apply(undefined, params);
            }
        };
        $scope.runOnMainScopeAndClose = function(funcName, params) {
            $scope.hideModal();
            var routeScope = self.app.scopesForRoutes[self.route];
            if (routeScope) {
                routeScope.$eval(funcName).apply(undefined, params);
            }
        };

    },
    setState: function(self, route, active, available, data) {
        self.data = data;
        self.route = route;

        if (window.NativeNav) {
            if (active && !self.popuptrigger) {
                self.scrollX = window.scrollX;
                self.scrollY = window.scrollY;
                self.originRect = null;
                if (data.element && data.element.length) {
                    self.originRect = data.element[0].getBoundingClientRect();
                }
                window.NativeNav.startNativeTransition("popup", self.originRect, function() {
                        $("body").addClass("cjs-shared-popup-active");
                        if (screen.width < 600) {
                            document.getElementById("viewport").setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
                        } else {
                            document.getElementById("viewport").setAttribute("content", "width=500, height=500, initial-scale=1, maximum-scale=1, user-scalable=0");
                        }
                        window.scrollTo(0, 0);
                        self.popuptrigger = {};
                        self.nativeTransition = true;
                        self.app.scopesForRoutes[self.route].$apply();
                        window.NativeNav.finishNativeTransition();
                    },
                    self.scope.hideModal
                );
            } else if (!active && self.popuptrigger) {
                window.NativeNav.startNativeTransition("closepopup", self.originRect, function() {
                    $("body").removeClass("cjs-shared-popup-active");
                    document.getElementById("viewport").setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
                    self.popuptrigger = null;
                    self.app.scopesForRoutes[self.route].$apply();
                    window.scrollTo(self.scrollX, self.scrollY);
                    window.NativeNav.finishNativeTransition();
                });
            }
        } else {
            if (!active) {
                self.popuptrigger = null;
            } else {
                self.popuptrigger = {
                    element: data.element,
                    additionalClasses: data.additionalClasses
                };
            }
        }
    }
});

Chondric.registerSharedUiComponent({
    id: "cjs-right-panel",
    templateUrl: "cjs-right-panel.html",
    handledSwipeState: "rightBorder",
    transition: "coverRight",
    nativeShowTransition: "showrightpanel",
    nativeHideTransition: "hiderightpanel",
    isNative: function() {
        return false;
    },
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.scope = $scope;
        $scope.componentId = self.id;
        self.defaultController = function() {};
        $scope.hideModal = function() {
            var routeScope = self.app.scopesForRoutes[self.route];
            if (self.data.closeCallback) {
                routeScope.$eval(self.data.closeCallback)(self.data);
            }

            // need to reset this so the popup doesnt reopen if the page is reactivated.
            self.app.setSharedUiComponentState(routeScope, self.id, false, true, self.data);
        };
        $scope.runOnMainScope = function(funcName, params) {
            var routeScope = self.app.scopesForRoutes[self.route];
            if (routeScope) {
                routeScope.$eval(funcName).apply(undefined, params);
            }
        };
        $scope.runOnMainScopeAndClose = function(funcName, params) {
            $scope.hideModal();
            var routeScope = self.app.scopesForRoutes[self.route];
            if (routeScope) {
                routeScope.$eval(funcName).apply(undefined, params);
            }
        };

    },
    setPanelPosition: function(self, progress) {
        self.popuptrigger = {
            progress: progress,
            transition: self.transition
        };
    },
    forceHide: function(self) {
        self.active = false;
        window.scrollTo(self.scrollX, self.scrollY);
        document.getElementById("viewport").setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");

    },
    forceShow: function(self) {
        self.scrollX = window.scrollX;
        self.scrollY = window.scrollY;
        self.active = true;
        document.getElementById("viewport").setAttribute("content", "width=260, initial-scale=1, maximum-scale=1, user-scalable=0");
        window.scrollTo(0, 0);
    },
    setState: function(self, route, active, available, data) {
        self.data = data;
        self.route = route;
        self.available = available;

        if (window.NativeNav) {
            if (active && !self.active) {
                self.originRect = null;
                if (data.element && data.element.length) {
                    self.originRect = data.element[0].getBoundingClientRect();
                }
                window.NativeNav.startNativeTransition(self.nativeShowTransition, null, function() {
                        $("body").addClass("cjs-shared-popup-active");
                        document.getElementById("viewport").setAttribute("content", "width=260, initial-scale=1, maximum-scale=1, user-scalable=0");
                        self.active = active;
                        window.scrollTo(0, 0);
                        self.app.scopesForRoutes[self.route].$apply();
                        window.NativeNav.finishNativeTransition();
                    },
                    self.scope.hideModal
                );
            } else if (!active && self.active) {
                window.NativeNav.startNativeTransition(self.nativeHideTransition, null, function() {
                    $("body").removeClass("cjs-shared-popup-active");
                    document.getElementById("viewport").setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
                    self.active = active;
                    self.app.scopesForRoutes[self.route].$apply();
                    window.scrollTo(self.scrollX, self.scrollY);
                    window.NativeNav.finishNativeTransition();
                });
            }
        } else {
            if (!active) {
                self.setPanelPosition(self, 0);
            } else {
                self.setPanelPosition(self, 1);
            }
        }


    },
    getSwipeNav: function(self, active, available) {
        var d = {};
        if (available) d[self.handledSwipeState] = {
            component: self.id
        };
        return d;
    },
    updateSwipe: function(self, swipeState) {
        if (!self.available) return;
        if (self.active) return;
        if (swipeState[self.handledSwipeState]) {
            self.setPanelPosition(self, swipeState[self.handledSwipeState]);
            self.scope.$apply();
        }
    },
    endSwipe: function(self, swipeState) {
        if (!self.available) return;
        if (self.active) return;

        if (swipeState[self.handledSwipeState]) {
            if (swipeState[self.handledSwipeState] < 0.1) {
                self.setPanelPosition(self, 0);
                self.scope.$apply();
            } else {
                self.setPanelPosition(self, 1);
                self.scope.$apply();
            }
        }


    }
});
Chondric.registerSharedUiComponent({
    id: "cjs-left-panel",
    baseComponentId: "cjs-right-panel",
    templateUrl: "cjs-left-panel.html",
    handledSwipeState: "leftBorder",
    transition: "coverLeft",
    nativeShowTransition: "showleftpanel",
    nativeHideTransition: "hideleftpanel",
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.baseController("cjs-right-panel", $scope);

        $scope.hideModal = function() {
            var routeScope = self.app.scopesForRoutes[self.route];
            if (self.data.closeCallback) {
                routeScope.$eval(self.data.closeCallback)(self.data);
            }

            // need to reset this so the popup doesnt reopen if the page is reactivated.
            self.app.setSharedUiComponentState(routeScope, self.id, false, true, self.data);
        };
    }
});
Chondric.allTransitions.crossfade = {
    transitionIn: {
        start: function(element) {
            // put new element in front with 0 opacity
            element.css({
                "display": "block",
                "opacity": 0,
                "z-index": 9
            });
        },
        cancel: function(element, prevProgress) {
            // move element to left with transition
            var time = (prevProgress) * 300;
            $(element).css({
                "-webkit-transition": "opacity " + time + "ms ease-in-out",
                "opacity": 0
            });

            return time;
        },
        complete: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (1 - prevProgress) * 300;
            $(element).css({
                "-webkit-transition": "opacity " + time + "ms ease-in-out",
                "opacity": 1
            });
            return time;
        },
        progress: function(element, progress) {
            element.css({
                "display": "block",
                "opacity": progress,
                "z-index": 9
            });
        }
    },
    transitionOut: {
        start: function(element) {
            // just ensure the old page remains visible while the new page fades in on top
            element.css({
                "display": "block"
            });
        },
        cancel: function(element, prevProgress) {
            var time = (prevProgress) * 300;
            return time;
        },
        complete: function(element, prevProgress) {
            // move element to right with transition
            var time = (1 - prevProgress) * 300;
            return time;
        },
        progress: function(element) {
            element.css({
                "display": "block"
            });
        }
    },
    reset: function(element) {
        // remove transition, transform and display settings from relevant subelements
        element.css({
            "display": "",
            "opacity": "",
            "z-index": "",
            "-webkit-transition": ""
        });
    }
};

Chondric.allTransitions.slideleft = {
    transitionIn: {
        start: function(element) {
            // show element and move to left
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(100%, 0)"
            });
        },
        cancel: function(element, prevProgress) {
            // move element to left with transition
            var time = (prevProgress) * 300;

            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(100%, 0)"
            });

            return time;
        },
        complete: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (1 - prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(0, 0)"
            });
            return time;
        },
        progress: function(element, progress) {
            // set element position without transition
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + ((1 - progress) * 100) + "%, 0)"
            });
        }
    },
    transitionOut: {
        start: function(element) {
            // set webkit-transform to 0
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(0, 0)"
            });

        },
        cancel: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(0, 0)"
            });
            return time;
        },
        complete: function(element, prevProgress) {
            // move element to right with transition
            var time = (1 - prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(-100%, 0)"
            });
            return time;
        },
        progress: function(element, progress) {
            // set element position without transition
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + (progress * -100) + "%, 0)"
            });
        }
    },
    reset: function(element) {
        // remove transition, transform and display settings from relevant subelements
        element.css({
            "display": ""
        });
        $(".body", element).css({
            "-webkit-transition": "",
            "-webkit-transform": ""
        });
    }
};
Chondric.allTransitions.slideright = {
    transitionIn: {
        start: function(element) {
            // show element and move to left
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(-100%, 0)"
            });
        },
        cancel: function(element, prevProgress) {
            // move element to left with transition
            var time = (prevProgress) * 300;

            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(-100%, 0)"
            });

            return time;
        },
        complete: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (1 - prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(0, 0)"
            });
            return time;
        },
        progress: function(element, progress) {
            // set element position without transition
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + ((1 - progress) * -100) + "%, 0)"
            });
        }
    },
    transitionOut: {
        start: function(element) {
            // set webkit-transform to 0
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(0, 0)"
            });

        },
        cancel: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(0, 0)"
            });
            return time;
        },
        complete: function(element, prevProgress) {
            // move element to right with transition
            var time = (1 - prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(100%, 0)"
            });
            return time;
        },
        progress: function(element, progress) {
            // set element position without transition
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + (progress * 100) + "%, 0)"
            });
        }
    },
    reset: function(element) {
        // remove transition, transform and display settings from relevant subelements
        element.css({
            "display": ""
        });
        $(".body", element).css({
            "-webkit-transition": "",
            "-webkit-transform": ""
        });
    }
};
/* jshint devel: true, browser: true, unused: false */
/* global Chondric: true */

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
                    });

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