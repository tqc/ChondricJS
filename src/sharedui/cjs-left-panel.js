Chondric.registerSharedUiComponent({
    id: "cjs-left-panel",
    baseComponentId: "cjs-right-panel",
    templateUrl: "cjs-left-panel.html",
    handledSwipeState: "leftBorder",
    transition: "coverLeft",
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.baseController("cjs-right-panel", $scope);

        $scope.hideModal = function() {
            var routeScope = self.app.scopesForRoutes[self.route];
            if (self.data.closeCallback) {
                routeScope.$eval(self.data.closeCallback)(self.data);
            }

            // need to reset this so the popup doesnt reopen if the page is reactivated.
            self.app.setSharedUiComponentState(routeScope, self.id, false, true, self.data);
        };
    }
});