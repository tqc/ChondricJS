import {SharedUiComponent} from "./shareduicomponent";

export default class cjsTabFooter extends SharedUiComponent {
    constructor() {
        super();
        this.componentId = "cjsTabFooter";
        this.template=require("./cjs-tab-footer.html");
    }
    isNative() {
        return window.NativeNav && true || false;
    }
    controller($scope) {
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
    }
    setState(self, route, active, available, data) {
        self.data = data;
        self.route = route;
        self.active = active;
        self.available = available;
        self.selectedTab = data.selectedTab;

        if (window.NativeNav) {
            window.NativeNav.showTabbar(route, active, data.buttons, data.selectedTab);
        }
    }
}