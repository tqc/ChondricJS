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
                window.NativeNav.startNativeTransition("popup", function() {
                    $("body").addClass("cjs-shared-popup-active");
                    if (screen.width < 600) {
                        document.getElementById("viewport").setAttribute("content", "width=device-width, height=device-height, initial-scale=1, maximum-scale=1, user-scalable=0");
                    } else {
                        document.getElementById("viewport").setAttribute("content", "width=500, height=500, initial-scale=1, maximum-scale=1, user-scalable=0");
                    }
                    window.scrollTo(0, 0);
                    self.popuptrigger = {};
                    self.nativeTransition = true;
                    self.app.scopesForRoutes[self.route].$apply();
                });
            } else if (!active && self.popuptrigger) {
                window.NativeNav.startNativeTransition("closepopup", function() {
                    $("body").removeClass("cjs-shared-popup-active");
                    document.getElementById("viewport").setAttribute("content", "width=device-width, height=device-height, initial-scale=1, maximum-scale=1, user-scalable=0");
                    self.popuptrigger = null;
                    self.app.scopesForRoutes[self.route].$apply();
                    window.scrollTo(self.scrollX, self.scrollY);
                });
            }
        } else {
            if (!active) {
                self.popuptrigger = null;
            } else {
                self.popuptrigger = {};
            }
        }
    }
});