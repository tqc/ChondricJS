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
Chondric.registerSharedUiComponent = function(component) {
    Chondric.sharedUiComponents[component.id] = component;
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
                templateId: viewOptions.templateId,
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
                controller: pageController,
                //            templateUrl: viewOptions.templateUrl,
                //            templateId: viewOptions.templateId,
            };
        };

        app.sharedUiComponents = {};
        for (var k in Chondric.sharedUiComponents) {
            var sc = Chondric.sharedUiComponents[k];
            app.sharedUiComponents[k] = {
                app: app,
                id: sc.id,
                template: sc.template,
                templateUrl: sc.templateUrl,
                controller: sc.controller,
                setState: sc.setState,
                setStatePartial: sc.setStatePartial,
                updateSwipe: sc.updateSwipe,
                endSwipe: sc.endSwipe
            };
        }

        app.registerSharedUiComponent = function(component) {
            app.sharedUiComponents[component.id] = component;
        };

        app.controller = function($scope, $location) {
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


            $scope.setSharedUiComponentState = app.setSharedUiComponentState = function(routeScope, componentId, active, available, data) {
                app.scopesForRoutes[routeScope.rk] = routeScope;
                var component = app.sharedUiComponents[componentId];
                if (!component) {
                    throw new Error(
                        "Shared UI Component " + componentId + " not found"
                    );
                }
                var csfr = app.componentStatesForRoutes[routeScope.rk] = app.componentStatesForRoutes[routeScope.rk] || {};
                var cs = csfr[componentId] || {
                    route: routeScope.rk
                };
                // if parameters are undefined, the previous value will be used
                if (active === true || active === false) cs.active = active;
                if (available === true || available === false) cs.available = available;
                if (data !== undefined) cs.data = data;
                csfr[componentId] = cs;
                if ($scope.route == routeScope.rk) {
                    component.setState(component, routeScope.rk, active, available, data);
                }

            };


            app.scopesForRoutes = {};
            app.componentStatesForRoutes = {};

            function loadView(url) {
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
                        if (mrp[j][0] == "$") params[mrp[j].substr(1)] = decodeURIComponent(parts[j]);
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

            $scope.changePage = app.changePage = function(p, transition) {
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
                $scope.transition.type = transition || "crossfade";
                $scope.noTransition = true;
                loadView(r);
                $scope.nextRoute = r;
                $scope.transition.progress = 0;
                $scope.transition.from = $scope.route;
                $scope.transition.to = $scope.nextRoute;
                window.setTimeout(function() {
                    $scope.noTransition = false;
                    $scope.route = r;
                    $scope.transition.progress = 1;
                    $scope.$apply();
                }, 100);

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
                            if (swipeState[p] > 0.6) {
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

            $scope.$watch("transition", function(transition) {
                if (!transition) return;
                if (!transition.to) return;
                var fromStates = app.componentStatesForRoutes[transition.from] || {};
                var toStates = app.componentStatesForRoutes[transition.to] || {};

                for (var k in app.sharedUiComponents) {
                    var component = app.sharedUiComponents[k];
                    var fromState = fromStates[k] || {
                        route: transition.from,
                        active: false,
                        available: false,
                        data: null
                    };
                    var toState = toStates[k] || {
                        route: transition.to,
                        active: false,
                        available: false,
                        data: null
                    };
                    if (component.setStatePartial) {
                        component.setStatePartial(component, fromState, toState, transition.progress);
                    } else {
                        if (transition.progress > 0.5) {
                            component.setState(component, toState.route, toState.active, toState.available, toState.data);
                        } else {
                            component.setState(component, fromState.route, fromState.active, fromState.available, fromState.data);
                        }
                    }
                }

            }, true);


            $scope.$watch("route", function(url, oldVal) {
                if (!url) return;
                if (document.activeElement) document.activeElement.blur();
                $scope.nextRoute = null;
                $scope.lastRoute = oldVal;
                $location.path(url).replace();
                loadView(url);
                viewCleanup($scope.openViews, [$scope.route, $scope.nextRoute, $scope.lastRoute]);
            });
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

            if (settings.loadPageFromHash && location.hash.length > 1 && location.hash.indexOf("access_token=") < 0) {
                var parts = location.hash.substr(2).split("/");
                for (var i = 0; i < parts.length; i++) {
                    parts[i] = decodeURIComponent(parts[i]);
                }
                app.changePage(parts);
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
                    console.log("Size changed: " + w + "x" + h);
                    if (h == 1024 || h == 768 || h == 320 || h == 568 || h == 480) {
                        $(".viewport").addClass("hasstatusbar");
                    } else {
                        $(".viewport").removeClass("hasstatusbar");
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

                        // create database
                        initData(function() {
                            //load data
                            settings.loadData.call(app, null, function() {
                                // attach common events
                                attachEvents(function() {

                                    if (window.NativeNav) {
                                        window.NativeNav.handleAction = function(route, action) {
                                            var routeScope = app.scopesForRoutes[route];
                                            if (routeScope) {
                                                routeScope.$apply(action);
                                            }
                                        };

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