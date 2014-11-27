import {cjsRightPanel} from "./cjs-right-panel";

export default class cjsLeftPanel extends cjsRightPanel {
    constructor() {
        super();
        this.template=require("./cjs-left-panel.html");
    this.handledSwipeState= "leftBorder";
    this.transition= "coverLeft";
    this.nativeShowTransition= "showleftpanel";
    this.nativeHideTransition= "hideleftpanel";
    }
    controller($scope) {
        var self = $scope.componentDefinition;
        super($scope);

        $scope.hideModal = function() {
            var routeScope = self.app.scopesForRoutes[self.route];
            if (self.data.closeCallback) {
                routeScope.$eval(self.data.closeCallback)(self.data);
            }

            // need to reset this so the popup doesnt reopen if the page is reactivated.
            self.app.setSharedUiComponentState(routeScope, self.id, false, true, self.data);
        };
    }
}