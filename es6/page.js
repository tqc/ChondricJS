export class Page {
    constructor(route, params, options) {
        options = options || {
            sharedUi: {}
        };
        if (!route) {
            throw new Error("Error creating page - route missing");
        }
        if (!params) {
            throw new Error("Error creating page - params missing");
        }
        this.route = route;
        this.params = params;
        this.options = options;
        this.isBlockPage = true;

        var page = this;

        for (var k in options.sharedUi) {
            var componentId = options.sharedUi[k];
            var component = app.sharedUiComponents[componentId];
            if (!component) {
                throw new Error(
                    "Shared UI Component " + componentId + " not found"
                );
            }

            var csfr = app.componentStatesForRoutes[route] = app.componentStatesForRoutes[route] || {};
            var cs = csfr[componentId] = csfr[componentId] || {
                route: route,
                active: false,
                available: true,
                data: {}
            };

        }




        page.pageCtrl = function($scope, sharedUi, loadStatus) {
            for (var k in params) {
                $scope[k] = params[k];
            }
            var xloadStatus = loadStatus.init($scope);

            var xsharedUi = sharedUi.init($scope, options.sharedUi);

            page.controller($scope, xsharedUi, xloadStatus);

            $scope.$watch("route", function(newVal, oldVal) {
                console.log("Watch for " + $scope.pageRoute + " - Changed from " + oldVal + " to " + newVal);
                if (newVal == $scope.pageRoute) {
                    // activated
                    page.activated($scope);
                    page.deactivationHandled = false;
                } else if (oldVal == $scope.pageRoute) {
                    // deactivated
                    if (!page.deactivationHandled) {
                        page.deactivated($scope);
                        page.deactivationHandled = true;
                    }

                }
            });

            $scope.$on("$destroy", function() {
                console.log("Destroying scope for " + page.route);
                if (!page.deactivationHandled) {
                    page.deactivated($scope);
                    page.deactivationHandled = true;
                }
            });
        };
    }
    controller($scope) {
        $scope.testValue1 = "Test value from base";

    }
    activated($scope) {

    }
    deactivated($scope) {

    }
}

Page.isSection = false;
