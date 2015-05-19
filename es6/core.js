if (!window.$) {
    // jquery needs to be global for angular to see it.
    window.$ = window.jQuery = require('jquery');
}
var angular = require('angular');
if (!window.angular) window.angular = angular;


//import {ngTap} from "./directives/ng-tap.js";

import {
    Page
}
from "./page.js";
export {
    Page
};


// Fix Function#name on browsers that do not support it (IE):
// http://stackoverflow.com/a/17056530/101970
if (!(function f() {}).name) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function() {
            var name = this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
            // For better performance only parse once, and then cache the
            // result through a new accessor for repeated access.
            Object.defineProperty(this, 'name', {
                value: name
            });
            return name;
        }
    });
}


export class App {
    constructor(options) {
        this.options = options;
        this.title = options.title;
        this.moduleName = options.moduleName || "chondric";

        this.module = angular.module(this.moduleName, []);

        this.module.directive('ngTap', require("./directives/ng-tap.js").ngTap);
        this.module.directive('ngStylePrefixer', require("./directives/ng-style-prefixer.js").default);

        this.module.directive('cjsSharedComponent', require("./directives/cjs-shared-component.js").cjsSharedComponent);
        this.module.directive('chondricPage', require("./directives/chondric-page.js").chondricPage);


        this.registerOptionalDirective(require("./directives/cjs-popover"));


        this.registerOptionalDirective(require("./directives/chondric-viewport"));

        this.registerOptionalDirective(require("./loadstatus/cjs-loading-overlay"));
        this.registerOptionalDirective(require("./loadstatus/cjs-show-after-load"));



        this.module.factory('sharedUi', require("./sharedui/shareduiprovider.js").default);
        this.module.factory('loadStatus', require("./loadstatus/loadstatusprovider.js").default);

        this.sharedUiComponents = {};
        this.additionalInjections = [];

        // this.sharedUiComponents.popup = new require("./sharedui/popup.js").SharedPopup();

        this.allRoutes = {};

        this.noop = function() {};
        this.hostSettings = require("build/hostsettings");
    }

    registerPage(pageclass, route, options) {
        if (pageclass["default"]) pageclass = pageclass["default"];
        route = route || pageclass.routeTemplate;
        console.log("Registering page " + pageclass.name + " on route " + route);
        this.allRoutes[route] = {
            pageclass: pageclass,
            options: options || {}
        };
    }

    registerSection(pageclass, route, options) {
        this.registerPage(pageclass, route, options);
    }

    registerSharedUiComponent(componentClass) {
        if (componentClass["default"]) componentClass = componentClass["default"];
        console.log("Registering shared UI component " + componentClass.name);
        var component = new componentClass();
        component.app = this;
        component.componentId = component.componentId || component.componentName || componentClass.componentName || componentClass.name;
        this.sharedUiComponents[component.componentId] = component;
    }

    registerOptionalDirective(options) {
        this.knownOptionalDirectives = this.knownOptionalDirectives || [];
        if (options.default) options = options.default;
        if (this.knownOptionalDirectives.indexOf(options.name) >= 0) return;
        this.knownOptionalDirectives.push(options.name);
        var arr = options.injections || [];
        arr = arr.concat([options.fn]);
        this.module.directive(options.name, arr);
    }

    registerOptionalFilter(options) {
        this.knownOptionalFilters = this.knownOptionalFilters || [];
        if (options.default) options = options.default;
        if (this.knownOptionalFilters.indexOf(options.name) >= 0) return;
        this.knownOptionalFilters.push(options.name);
        var arr = options.injections || [];
        arr = arr.concat([options.fn]);
        this.module.filter(options.name, arr);
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
            return a.split("/").length - b.split("/").length;
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

            var page = openViews[ar];
            if (!page) {
                openViews[ar] = page = new template.pageclass(ar, params, template.options);
                page.initSharedUiComponents(app);
            }
            if (page.subsections) openViews = page.subsections;
            if (position) page.position = position;

            app.updateOpenViewArray($scope.openViews, $scope.openViewArray);

        }
    }
    transitionComponents(fromRoute, toRoute, progress) {
        if (!toRoute) return;
        var app = this;

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
                } else if (fromState.route) {
                    component.setState(component, fromState.route, fromState.active, fromState.available, fromState.data);
                }
            }
        }

    }
    pushPopup(p) {
        if (!p) return;
        var r;
        if (p instanceof Array) {
            r = "";
            for (let i = 0; i < p.length; i++) {
                r += "/" + p[i];
            }
        } else {
            r = p;
        }

        this.changePage(this.scope.route + ";" + r);
    }
    closePopup() {
        let ss = this.scope.route.split(";");
        this.changePageInternal(ss[0], ss[0], []);
    }
    popPopup() {
        // todo: remove last item from route
        let ss = this.scope.route.split(";");
        var l = ss.length - 1;
        while (l > 1 && !ss[l]) l--;
        this.changePageInternal(ss[0], ss[0], ss.slice(1, l));
    }
    changePage(p, transition, originElement) {

        console.log("Changing page to " + p);
        var $scope = this.scope;
        var lastRoute, mainRoute;
        var popups = [];

        if (p instanceof Array) {
            if (p[0] instanceof Array) {
                // parameter is [["main"], ["popup"]]
                mainRoute = "";
                for (let i = 0; i < p[0].length; i++) {
                    mainRoute += "/" + p[0][i];
                }
                for (let j = 1; j < p.length; j++) {
                    popups[j] = "";
                    for (let i = 0; i < p[j].length; i++) {
                        popups[j - 1] += "/" + p[j][i];
                    }
                }
            } else if (p[0].indexOf("/") >= 0) {
                // parameter is ["/main", "/popup"]
                mainRoute = p[0];
                for (let j = 1; j < p.length; j++) {
                    if (p[j]) popups[j - 1] = p[j];
                }
            } else {
                // old syntax - single route with array of path components
                mainRoute = "";
                for (let i = 0; i < p.length; i++) {
                    mainRoute += "/" + p[i];
                }
            }
        } else {
            // parameter is /main;/popup
            let ss = p.split(';');
            mainRoute = ss[0];
            for (let j = 1; j < ss.length; j++) {
                if (ss[j]) popups[j - 1] = ss[j];
            }
        }

        if ($scope.route) {
            let ss = $scope.route.split(";");
            lastRoute = ss[0];
        }

        this.changePageInternal(lastRoute, mainRoute, popups, transition, originElement);

    }

    changePageInternal(lastPageRoute, currentPageRoute, popups, transition, originElement) {

        if (lastPageRoute) {
            var path = require("path");
            currentPageRoute = path.resolve(lastPageRoute, currentPageRoute);
            for (let i = 0; i < popups.length; i++) {
                if (!popups[i]) continue;
                popups[i] = path.resolve(lastPageRoute, popups[i]);
            }
        }

        console.log("changePageInternal");
        console.log(popups);
        console.log(currentPageRoute);
        var fullRoute = currentPageRoute + ";" + popups.join(";");
        //        if ($scope.route == r) return;
        //        if ($scope.lastRoute == r) $scope.lastRoute = null;

        var app = this;
        var $scope = this.scope;
        var r = currentPageRoute;

        var fromRoute = lastPageRoute;
        var toRoute = currentPageRoute;


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


        if (app.transitionMode == "none" || transition == "none") {
            app.loadView(r);
            if (popups[popups.length - 1]) app.loadView(popups[popups.length - 1]);
            app.$timeout(function() {
                $scope.route = fullRoute;
                $scope.activePopups = popups;
                //$scope.$apply();
                app.$timeout(function() {
                    app.transitionComponents(fromRoute, toRoute, 1);
                    // $scope.$apply();
                }, 0);
            }, 0);

        } else if (app.transitionMode == "native") {
            // disable pointer events for 300ms to prevent ghost clicks.
            if (window.jstimer) window.jstimer.start("transitioningTimeout");

            angular.element(document.body).addClass("cjs-transitioning");
            window.setTimeout(function() {
                if (window.jstimer) window.jstimer.finish("transitioningTimeout");
                angular.element(document.body).removeClass("cjs-transitioning");
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
                //                        angular.element(".chondric-page.active").removeClass("active");
                if (window.jstimer) window.jstimer.finish("transitioningCallback1");
                if (window.jstimer) window.jstimer.start("transitioningTimeout2");
                window.setTimeout(function() {
                    if (window.jstimer) window.jstimer.finish("transitioningTimeout2");
                    if (window.jstimer) window.jstimer.start("transitioningTimeout3");
                    app.loadView(r);
                    if (popups[popups.length - 1]) app.loadView(popups[popups.length - 1]);
                    $scope.route = fullRoute;
                    $scope.activePopups = popups;

                    $scope.$apply();
                    app.transitionComponents(fromRoute, toRoute, 1);
                    $scope.$apply();
                    window.NativeNav.finishNativeTransition();
                    if (window.jstimer) window.jstimer.finish("transitioningTimeout3");
                }, 0);

            });
        } else {

            $scope.transition.type = transition || "crossfade";
            $scope.noTransition = true;
            app.loadView(r);
            if (popups[popups.length - 1]) app.loadView(popups[popups.length - 1]);
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
                $scope.route = fullRoute;
                $scope.activePopups = popups;
                $scope.transition.progress = 1;
                $scope.$apply();
            }, 100);

        }
    }

    customInit() {
        console.log("Base custom init");
        this.loadStartPage();
    }
    initController() {
        console.log("initController");
        var app = this;
        var inj = ["$scope", "$location", "$element", "$attrs", "$rootScope", "$timeout"].concat(this.additionalInjections);
        var appCtrl = function($scope, $location, $element, $attrs, $rootScope, $timeout, a, b, c, d, e) {
            console.log("running app module controller");
            app.scope = $scope;
            app.rootScope = $rootScope;
            app.$timeout = $timeout;

            if ($attrs.startPage) {
                app.startPageFromHtml = $attrs.startPage;
            }

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
                app.scopesForRoutes[routeScope.pageRoute] = routeScope;

                var component = app.sharedUiComponents[componentId];
                if (!component) {
                    throw new Error(
                        "Shared UI Component " + componentId + " not found"
                    );
                }

                var csfr = app.componentStatesForRoutes[routeScope.pageRoute] = app.componentStatesForRoutes[routeScope.pageRoute] || {};
                var cs = csfr[componentId] = csfr[componentId] || {
                    route: routeScope.pageRoute,
                    active: false,
                    available: false,
                    data: {}
                };

                return cs;
            };


            $scope.setSharedUiComponentState = app.setSharedUiComponentState = function(routeScope, componentId, active, available, data) {
                console.log("setSharedUiComponentState");
                console.log(data);
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

                //if (component.getSwipeNav) app.updateSwipeNav(routeScope, component.getSwipeNav(component, cs.active, cs.available));

                if ($scope.route && $scope.route.split(";")[0] == routeScope.pageRoute) {
                    component.setState(component, routeScope.pageRoute, cs.active, cs.available, cs.data);
                }

            };


            app.scopesForRoutes = {};
            app.scrollPosForRoutes = {};
            app.swipeNavForRoutes = {};
            app.transitionOriginForRoutes = {};
            app.componentStatesForRoutes = {};





            $scope.changePage = function(a, b, c) {
                // because angular expressions can pass in lastTap but not lastTap.element in angular 1.3
                if (c && c.element) c = c.element;
                app.changePage(a, b, c);
            };

            $scope.pushPopup = function(a, b, c) {
                app.pushPopup(a, b, c);
            };

            $scope.closePopup = function(a, b, c) {
                app.closePopup(a, b, c);
            };

            $scope.popPopup = function(a, b, c) {
                app.popPopup(a, b, c);
            };


            $rootScope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
                if (!oldUrl || !newUrl || oldUrl == newUrl) return;
                var ind = newUrl.indexOf("#");
                if (ind < 0) return;
                var hash = newUrl.substr(ind + 1);
                if (hash.indexOf("access_token=") >= 0) return;
                if (hash == $scope.route) return;
                app.changePage(hash);
            });

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



            $scope.$watch("transition", function(transition) {
                if (!transition) return;
                if (!transition.to) return;

                app.transitionComponents(transition.from, transition.to, transition.progress);


            }, true);


            $scope.$watch("route", function(url, oldVal) {
                console.log("route watch: " + oldVal + " -> " + url);
                if (!url) return;
                if (document.activeElement && app.transitionMode != "native" && document.activeElement.tagName != "BODY") {
                    if (angular.element(document.activeElement).closest(".body").length > 0) {
                        // only blur if the active element was inside a page body - page headers etc can remain focused.
                        document.activeElement.blur();
                    }
                }
                $scope.nextRoute = null;
                $scope.lastRoute = oldVal;
                $location.path(url).replace();
                app.loadView(url.split(";")[0]);
                viewCleanup($scope.openViews, [$scope.route, $scope.nextRoute, $scope.lastRoute].concat($scope.activePopups).concat(app.preloadedRoutes || []));
                if (window.NativeNav) {
                    window.NativeNav.setValidGestures(app.swipeNavForRoutes[url] || {});
                }
                // this doesn't make sense in embedded mode
                if (!$element.hasClass("embedded")) {
                    window.setTimeout(function() {
                        var sp = app.scrollPosForRoutes[url];
                        if (sp) {
                            window.scrollTo(sp.x, sp.y);
                        } else {
                            window.scrollTo(0, 0);
                        }
                    }, 10);
                }
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

        var app = this;
        if (window.NativeNav) {
            app.transitionMode = "native";
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


        this.customInit();
    }
    appCtrl($scope, $http) {
        console.log("App controller on core");
    }
    getStartPage(route) {
        // start page may come from one of several places:
        // parameter set by calling customInit function
        // hash from url - optional. App may disable this if pages have to be accessed in a particular order.
        // attribute set in calling html
        // default from this.defaultStartPage

        if (route) return route;
        if (this.options.useLocationHash && location.hash.length > 1 && location.hash.indexOf("access_token=") < 0) {
            var allpaths = location.hash.substr(2).split(";");
            var parts = allpaths[0].split("/");
            for (var i = 0; i < parts.length; i++) {
                parts[i] = decodeURIComponent(parts[i]);
            }
            return parts;
        }
        if (this.startPageFromHtml) return this.startPageFromHtml;
        if (this.options.defaultStartPage) return this.options.defaultStartPage;
        return "/start";
    }
    loadStartPage(route) {
        route = this.getStartPage(route);

        this.changePage(route, "none");
        this.ready = true;
        var event = document.createEvent("HTMLEvents");
        event.initEvent("chondric.appready", true, true);
        document.dispatchEvent(event);

    }
    start() {
        var app = this;

        this.initController();
        angular.element(document).ready(function() {
            angular.bootstrap(document, [app.moduleName]);
        });
    }
}
