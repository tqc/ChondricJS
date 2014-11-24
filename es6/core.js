var angular = require('angular');


//import {ngTap} from "./directives/ng-tap.js";

import {
    Page
}
from "./page.js";
export {
    Page
};

export class App {
    constructor(options) {
        this.title = options.title;
        this.moduleName = options.moduleName || "chondric";

        this.module = angular.module(this.moduleName, []);

        this.module.directive('ngTap', require("./directives/ng-tap.js").ngTap);

        this.module.directive('cjsSharedComponent', require("./directives/cjs-shared-component.js").cjsSharedComponent);
        this.module.directive('chondricViewport', require("./directives/chondric-viewport.js").chondricViewport);
        this.module.factory('sharedUi', require("./sharedui/shareduiprovider.js").default);
        this.module.factory('loadStatus', require("./loadstatus/loadstatusprovider.js").default);

        this.sharedUiComponents = {};
        this.additionalInjections = [];

        // this.sharedUiComponents.popup = new require("./sharedui/popup.js").SharedPopup();

        this.allRoutes = {};
    }

    registerPage(pageclass) {
        if (pageclass["default"]) pageclass = pageclass["default"];
        console.log("Registering page " + pageclass.name + " on route " + pageclass.routeTemplate);
        this.allRoutes[pageclass.routeTemplate] = pageclass;
    }

    registerSection(pageclass) {
        if (pageclass["default"]) pageclass = pageclass["default"];
        console.log("Registering section " + pageclass.name + " on route " + pageclass.routeTemplate);
        this.allRoutes[pageclass.routeTemplate] = pageclass;
    }

    registerSharedUiComponent(pageclass) {
        if (pageclass["default"]) pageclass = pageclass["default"];
        console.log("Registering shared UI component " + pageclass.name);

        this.sharedUiComponents[pageclass.componentName || pageclass.name] = new pageclass();
    }


    updateOpenViewArray(parentObject, parentArray) {
        parentArray.splice(0, parentArray.length);
        for (var k in parentObject) {
            var v = parentObject[k];
            parentArray.push(v);
            if (v.subsections) {
                v.subsectionArray = v.subsectionArray || [];
                this.updateOpenViewArray(v.subsections, v.subsectionArray);
            }
        }
    }


    loadView(url, position) {
        var app = this;
        var $scope = app.scope;

        if (!url) {
            // first run - load start page
            throw new Error("loadView requires a valid route URL");
        }
        var matchingRoutes = [];
        var parts = url.split("/");
        routeLoop: for (var r in app.allRoutes) {
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
                    openViews[ar] = section = new template(params);
                    section.route = ar;
                }
                openViews = section.subsections;
            } else {
                var page = openViews[ar];
                if (!page) {
                    page = openViews[ar] =
                        new template(params);
                    page.route = ar;
                }
                if (position) page.position = position;
            }
            app.updateOpenViewArray($scope.openViews, $scope.openViewArray);

        }
    }

    changePage(p, transition, originElement) {
        console.log("Changing page to " + p);
        var app = this;
        var $scope = this.scope;
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
            app.loadView(r);
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
                    app.loadView(r);
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
            app.loadView(r);
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
    }

    customInit() {
        console.log("Base custom init");
    }
    initController() {
        console.log("initController");
        var app = this;
        var inj = ["$scope", "$location", "$element", "$attrs"].concat(this.additionalInjections);
        var appCtrl = function($scope, $location, $element, $attrs, a, b, c, d, e) {
            console.log("running app module controller");
            app.scope = $scope;
            $scope.app = app;
            $scope.allRoutes = app.allRoutes;
            $scope.route = null;
            $scope.nextRoute = null;
            $scope.lastRoute = null;
            $scope.transition = {
                type: "crossfade",
                progress: 0
            };

            $scope.openViews = {};
            $scope.openViewArray = [];

            $scope.sharedUiComponents = app.sharedUiComponents;

            // these will usually get overridden on a child scope - otherwise names have to be globally unique
            $scope.showModal = function(name, lastTap) {
                $scope[name] = lastTap;
            };

            $scope.hideModal = function(name) {
                $scope[name] = null;
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





            $scope.changePage = app.changePage;

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

                app.updateOpenViewArray($scope.openViews, $scope.openViewArray);

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
                app.loadView(url);
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

            app.appCtrl($scope, a, b, c, d, e);

            app.init();
        }; // end appCtrl
        app.module.controller("appCtrl", inj.concat([appCtrl]));
    }

    init() {
        console.log("App Init");
        this.customInit();
    }
    appCtrl($scope, $http) {
        console.log("App controller on core");
    }
    start() {
        var app = this;
        this.initController();

        app.module.run(["$rootScope", "$compile", "$controller",
            function($rootScope) {
                app.rootScope = $rootScope;
                //app.init();
            }
        ]);

        angular.element(document).ready(function() {
            angular.bootstrap(document, [app.moduleName]);
        });
    }
}
