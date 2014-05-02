Chondric.registerSharedUiComponent({
    id: "cjs-action-sheet",
    templateUrl: "cjs-action-sheet.html",
    controller: function($scope) {
        var self = $scope.componentDefinition;
        $scope.hideModal = function() {
            self.popuptrigger = null;
            var routeScope = app.scopesForRoutes[self.route];
            // need to reset this so the popup doesnt reopen if the page is reactivated.
            app.setSharedUiComponentState(routeScope, "popupmenu", false, true, null);
        }
        $scope.handleSharedPopupButtonClick = function(b) {
            self.popuptrigger = null;
            var routeScope = app.scopesForRoutes[self.route];
            if (routeScope && b.action) {
                routeScope.$eval(b.action)
            }
        }
    },
    setState: function(self, route, active, available, data) {
        self.data = data;
        self.route = route;

        if (window.NativeNav) {
            var rect = popupoptions.element[0].getBoundingClientRect();
            NativeNav.showPopupMenu(popupoptions.scope.rk, rect.left, rect.top, rect.width, rect.height, popupoptions.items);
        } else {
            if (!active) {
                self.popuptrigger = null;
            } else {
                self.popuptrigger = {
                    element: data.element
                }
            }
        }
    }
})