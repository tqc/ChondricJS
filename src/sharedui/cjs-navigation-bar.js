Chondric.registerSharedUiComponent({
    id: "cjs-navigation-bar",
    templateUrl: "cjs-navigation-bar.html",
    controller: function($scope) {
        var self = $scope.componentDefinition;
        $scope.globalHeaderOptions = self.globalHeaderOptions = {}

        $scope.handleSharedHeaderButtonClick = function(headerOptions, b, lastTap) {
            console.log("clicked header button for " + self.route);
            var routeScope = app.scopesForRoutes[self.route];
            if (routeScope && b.action) {
                routeScope.$eval(b.action)
            } else if (routeScope && b.items) {

                app.setSharedUiComponentState(routeScope, "cjs-action-sheet", true, true, {
                    element: lastTap.element,
                    items: b.items
                })
            }
        }

    },
    setStatePartial: function(self, initialState, finalState, progress) {
        if (!self.globalHeaderOptions) return;
        var v1 = self.globalHeaderOptions.v1;
        var v2 = self.globalHeaderOptions.v2;
        if (v1 && v1.route == initialState.route) {
            self.globalHeaderOptions.v1 = initialState;
            self.globalHeaderOptions.v2 = finalState;
            self.globalHeaderOptions.transitionState = progress;
        } else {
            self.globalHeaderOptions.v2 = initialState;
            self.globalHeaderOptions.v1 = finalState;
            self.globalHeaderOptions.transitionState = 1 - progress;
        }
        if (progress < 0.5) {
            self.route = initialState.route;
            self.data = initialState.data;
        } else {
            self.route = finalState.route;
            self.data = finalState.data;
        }
    },
    setState: function(self, route, active, available, data) {
        if (!self.globalHeaderOptions) return;

        self.route = route;
        self.data = data;
        var v1 = self.globalHeaderOptions.v1;
        var v2 = self.globalHeaderOptions.v2;
        if (v1 && v1.route == route) {
            self.globalHeaderOptions.v1 = {
                route: route,
                active: active,
                available: available,
                data: data
            };
            self.globalHeaderOptions.transitionState = 0;
        } else {
            self.globalHeaderOptions.v2 = {
                route: route,
                active: active,
                available: available,
                data: data
            };
            self.globalHeaderOptions.transitionState = 1;
        }

    }
})