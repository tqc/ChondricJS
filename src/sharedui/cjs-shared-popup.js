Chondric.registerSharedUiComponent({
    id: "cjs-shared-popup",
    templateUrl: "cjs-shared-popup.html",
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.scope = $scope;
        self.defaultController = function() {};
        $scope.hideModal = function() {
            self.popuptrigger = null;
            var routeScope = app.scopesForRoutes[self.route];
            // need to reset this so the popup doesnt reopen if the page is reactivated.
            app.setSharedUiComponentState(routeScope, "cjs-shared-popup", false, true, null);
        }
        $scope.handleAction = function(funcName, params) {
            self.popuptrigger = null;
            var routeScope = app.scopesForRoutes[self.route];
            if (routeScope) {
                routeScope.$eval(funcName)(params);
            }
        }
    },
    setState: function(self, route, active, available, data) {
        self.data = data;
        self.route = route;

        if (!active) {
            self.popuptrigger = null;
        } else {
            self.popuptrigger = {}
        }

    }
})