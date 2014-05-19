Chondric.registerSharedUiComponent({
    id: "cjs-tab-footer",
    templateUrl: "cjs-tab-footer.html",
    isNative: function() {
        return false;
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
    },

});