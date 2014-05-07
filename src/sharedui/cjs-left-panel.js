Chondric.registerSharedUiComponent({
    id: "cjs-left-panel",
    templateUrl: "cjs-left-panel.html",
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
            self.app.setSharedUiComponentState(routeScope, "cjs-left-panel", false, true, self.data);
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
        self.active = active;
        self.available = available;

        if (!active) {
            self.popuptrigger = {
                progress: 0,
                transition: "coverLeft"
            };
        } else {
            self.popuptrigger = {
                progress: 1,
                transition: "coverLeft"
            };
        }

    },
    updateSwipe: function(self, swipeState) {
        if (!self.available) return;
        if (self.active) return;

        if (swipeState.leftBorder) {
            self.popuptrigger = {
                progress: swipeState.leftBorder,
                transition: "coverLeft"
            };
            self.scope.$apply();
        }

    },
    endSwipe: function(self, swipeState) {
        if (!self.available) return;
        if (self.active) return;

        if (swipeState.leftBorder) {
            if (swipeState.leftBorder < 0.1) {
                self.popuptrigger = {
                    progress: 0,
                    transition: "coverLeft"
                };
                self.scope.$apply();
            } else {
                self.popuptrigger = {
                    progress: 1,
                    transition: "coverLeft"
                };
                self.scope.$apply();
            }
        }


    }
});