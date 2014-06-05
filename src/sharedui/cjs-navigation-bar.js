Chondric.registerSharedUiComponent({
    id: "cjs-multistate-component",
    updateTransitionSettings: function(self, thisState, otherState, position, isActivating) {
        // set fields for individual components
        // position will be 0 for active, -1 or +1 for inactive depending on transition direction
        thisState.isActivating = isActivating;
        thisState.text = "Active? " + isActivating;
    },
    updateCurrentState: function(self, state, active, available, data) {

    },
    chooseState: function(self, route, active, available, data) {
        for (var i = 0; i < self.states.length; i++) {
            if (self.states[i].route == route) return self.states[i];
        }
        for (var i = 0; i < self.states.length; i++) {
            if (self.states[i] != self.activeState) return self.states[i];
        }
    },
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.scope = $scope;
        self.states = [{
            route: null,
            available: false,
            active: false,
            data: null
        }, {
            route: null,
            available: false,
            active: false,
            data: null
        }];
        self.activeState = null;
    },
    setState: function(self, route, active, available, data, direction) {
        console.log(self.id + ".setState(" + route + "," + active + "," + available + "," + data + "," + direction + ")");
        console.log(data);

        if (!data || !Object.keys(data).length) {
            console.log("no data");
        }


        if (!self.initialTransitionTimeout && !active && !available && (!data || !Object.keys(data).length)) {
            self.initialTransitionTimeout = window.setTimeout(function() {
                self.setState(self, route, active, available, data, direction);
                self.scope.$apply();
            }, 100);
            return;
        }
        window.clearTimeout(self.initialTransitionTimeout);

        var state = self.chooseState(self, route, active, available, data);
        state.route = route;
        state.active = active;
        state.available = available;
        state.data = data;

        if (self.isNative && self.isNative() && self.setNativeState) {
            console.log("native")
            self.setNativeState(self, route, active, available, data, direction);
        } else if (state == self.activeState) {
            // in place update - no animation
            console.log("in place");
            self.updateCurrentState(self, state, active, available, data);
        } else {
            console.log("new state");

            var otherState = self.states[((self.states.indexOf(state)) + 1) % self.states.length];
            self.updateTransitionSettings(self, state, otherState, 0, true);
            self.updateTransitionSettings(self, otherState, state, direction > 0 ? 1 : -1, false);
            self.activeState = state;
        }
    }
});

Chondric.registerSharedUiComponent({
    id: "cjs-navigation-bar",
    templateUrl: "cjs-navigation-bar.html",
    baseComponentId: "cjs-multistate-component",
    isNative: function() {
        return (window.NativeNav && true) || false;
    },
    updateTransitionSettings: function(self, thisState, otherState, position, isActivating) {
        console.log("navbar updateTransitionSettings - " + isActivating);
        console.log(thisState);
        // set fields for individual components
        // position will be 0 for active, -1 or +1 for inactive depending on transition direction
        thisState.isActivating = isActivating;
        thisState.text = "Active? " + isActivating;
        if (isActivating) {
            if (thisState.available) {
                if (!otherState.available) {
                    thisState.translateY = -80 * (Math.abs(position));
                } else {
                    thisState.translateY = 0;
                }
            } else {
                thisState.translateY = -80;
            }
            thisState.opacity = 1;
        } else {
            thisState.opacity = 0;
        }
    },
    updateCurrentState: function(self, state, active, available, data) {},
    setNativeState: function(self, route, active, available, data) {
        if (window.NativeNav) {
            window.NativeNav.showNavbar(route, active, data.leftButtons, data.title, data.rightButtons, data.titleChanged);
        }
    },
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.baseController("cjs-multistate-component", $scope);

        self.scope = $scope;
        $scope.globalHeaderOptions = self.globalHeaderOptions = {};

        $scope.handleSharedHeaderButtonClick = function(state, b, lastTap) {
            var routeScope = self.app.scopesForRoutes[state.route];
            if (routeScope && b.action) {
                routeScope.$eval(b.action);
            } else if (routeScope && b.items) {

                self.app.setSharedUiComponentState(routeScope, "cjs-action-sheet", true, true, {
                    element: lastTap.element,
                    items: b.items
                });
            }
        };

        $scope.titleChanged = function(state) {
            var routeScope = self.app.scopesForRoutes[state.route];
            if (routeScope && state.data.titleChanged) {
                routeScope.$eval(state.data.titleChanged)(state.data.title);
            }
        };
    }
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
    /*
    setState2: function(self, route, active, available, data) {
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

    }*/
});