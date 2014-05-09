Chondric.registerSharedUiComponent({
    id: "cjs-right-panel",
    templateUrl: "cjs-right-panel.html",
    handledSwipeState: "rightBorder",
    transition: "coverRight",
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
    setState: function(self, route, active, available, data) {
        self.data = data;
        self.route = route;
        self.active = active;
        self.available = available;

        if (!active) {
            self.setPanelPosition(self, 0);
        } else {
            self.setPanelPosition(self, 1);
        }

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