import {MultistateComponent} from "./multistatecomponent";

export default class cjsNavigationBar extends MultistateComponent {
	constructor() {
		super();
		this.template=require("./cjs-navigation-bar.html");
	}
    isNative() {
        return (window.NativeNav && true) || false;
    }
    updateTransitionSettings(self, thisState, otherState, position, isActivating) {
        // console.log("navbar updateTransitionSettings - " + isActivating);
        //        console.log(thisState);
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
    }
    updateCurrentState(self, state, active, available, data) {}
    setNativeState(self, route, active, available, data) {
        if (window.NativeNav) {
            window.NativeNav.showNavbar(route, active, data.leftButtons, data.title, data.rightButtons, data.titleChanged);
        }
    }
    controller($scope) {
    	super($scope);
        var self = $scope.componentDefinition;
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

}
