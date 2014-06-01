Chondric.registerSharedUiComponent({
    id: "cjs-navigation-bar",
    templateUrl: "cjs-navigation-bar.html",
    isNative: function() {
        return (window.NativeNav && true) || false;
    },
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.scope = $scope;
        $scope.globalHeaderOptions = self.globalHeaderOptions = {};

        $scope.handleSharedHeaderButtonClick = function(headerOptions, b, lastTap) {
            var routeScope = self.app.scopesForRoutes[self.route];
            if (routeScope && b.action) {
                routeScope.$eval(b.action);
            } else if (routeScope && b.items) {

                self.app.setSharedUiComponentState(routeScope, "cjs-action-sheet", true, true, {
                    element: lastTap.element,
                    items: b.items
                });
            }
        };

        $scope.titleChanged = function() {
            var routeScope = self.app.scopesForRoutes[self.route];
            if (routeScope && self.data.titleChanged) {
                routeScope.$eval(self.data.titleChanged)(self.data.title);
            }
        };
    },
    /*
    setStatePartial: function(self, initialState, finalState, progress) {
        if (!self.globalHeaderOptions) return;
        var v1 = self.globalHeaderOptions.v1;
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
    */
    setState: function(self, route, active, available, data) {
        if (!self.globalHeaderOptions) return;

        self.route = route;
        self.data = data;

        if (window.NativeNav) {
            window.NativeNav.showNavbar(route, active, data.leftButtons, data.title, data.rightButtons, data.titleChanged);
        } else {
            var v1 = self.globalHeaderOptions.v1;
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

    }
});