export class Page {
    constructor(route, params, options) {
    	options = options || {
    		sharedUi: {}
    	};
        this.route = route;
        this.params = params;
        this.options = options;

        var page = this;
        page.pageCtrl = function($scope, sharedUi, loadStatus) {
        	for (var k in params) {
        		$scope[k] = params[k];
        	}
            var xloadStatus = loadStatus.init($scope);

            var xsharedUi = sharedUi.init($scope, options.sharedUi);

            page.controller($scope, xsharedUi, xloadStatus);
        };
    }
    controller($scope) {
        $scope.testValue1 = "Test value from base";

    }
}

Page.isSection = false;
