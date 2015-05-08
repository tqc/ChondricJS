import {SharedUiComponent} from "./shareduicomponent";

export class cjsRightPanel extends SharedUiComponent {
    constructor() {
        super();
        this.componentId = "cjsRightPanel";
        this.template=require("./cjs-right-panel.html");
        this.handledSwipeState= "rightBorder";
        this.transition= "coverRight";
        this.nativeShowTransition= "showrightpanel";
        this.nativeHideTransition= "hiderightpanel";
    }
    isNative() {
        return false;
    }
    controller($scope) {
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

    }
    setPanelPosition(self, progress) {
        self.popuptrigger = {
            progress: progress,
            transition: self.transition
        };
    }
    forceHide(self) {
        self.active = false;
        window.scrollTo(self.scrollX, self.scrollY);
        document.getElementById("viewport").setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");

    }
    forceShow(self) {
        self.scrollX = window.scrollX;
        self.scrollY = window.scrollY;
        self.active = true;
        document.getElementById("viewport").setAttribute("content", "width=260, initial-scale=1, maximum-scale=1, user-scalable=0");
        window.scrollTo(0, 0);
    }
    setState(self, route, active, available, data) {
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


    }
    getSwipeNav(self, active, available) {
        var d = {};
        if (available) d[self.handledSwipeState] = {
            component: self.id
        };
        return d;
    }
    updateSwipe(self, swipeState) {
        if (!self.available) return;
        if (self.active) return;
        if (swipeState[self.handledSwipeState]) {
            self.setPanelPosition(self, swipeState[self.handledSwipeState]);
            self.scope.$apply();
        }
    }
    endSwipe(self, swipeState) {
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
}

export default cjsRightPanel;