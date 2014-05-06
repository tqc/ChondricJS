Chondric.registerSharedUiComponent({
    id: "cjs-shared-popup",
    templateUrl: "cjs-shared-popup.html",
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.scope = $scope;
        self.defaultController = function() {};

        $scope.hideModal = function() {
            var routeScope = self.app.scopesForRoutes[self.route];
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

        if (!active) {
            self.popuptrigger = null;
        } else {
            self.popuptrigger = {};
        }

    }
});