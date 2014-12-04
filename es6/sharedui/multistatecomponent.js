import {SharedUiComponent} from "./shareduicomponent";

export class MultistateComponent extends SharedUiComponent {
	 updateTransitionSettings(self, thisState, otherState, position, isActivating) {
        // set fields for individual components
        // position will be 0 for active, -1 or +1 for inactive depending on transition direction
        thisState.isActivating = isActivating;
        thisState.text = "Active? " + isActivating;
    }
    updateCurrentState(self, state, active, available, data) {

    }
    chooseState(self, route, active, available, data) {
        var i;
        for (i = 0; i < self.states.length; i++) {
            if (self.states[i].route == route) return self.states[i];
        }
        for (i = 0; i < self.states.length; i++) {
            if (self.states[i] != self.activeState) return self.states[i];
        }
    }
    controller($scope) {
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
    }
    setState(self, route, active, available, data, direction) {
               // console.log(self.componentId + ".setState(" + route + "," + active + "," + available + "," + data + "," + direction + ")");
               // console.log(data);

        if (!data || !Object.keys(data).length) {
            //   console.log("navbar setState - no data");
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
        state.available = available||active;
        state.data = data;

        if (self.isNative && self.isNative() && self.setNativeState) {
            //   console.log("native")
            self.setNativeState(self, route, active, available, data, direction);
        } else if (state == self.activeState) {
            // in place update - no animation
            //    console.log("in place");
            self.updateCurrentState(self, state, active, available, data);
        } else {
            //    console.log("new state");

            var otherState = self.states[((self.states.indexOf(state)) + 1) % self.states.length];
            self.updateTransitionSettings(self, state, otherState, 0, true);
            self.updateTransitionSettings(self, otherState, state, direction > 0 ? 1 : -1, false);
            self.activeState = state;
        }
        //console.log(self.states);
    }
}