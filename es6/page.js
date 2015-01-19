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
        if (options.template) this.template = options.template;

        this.preloadContent = options.preloadContent || require("./preload.html");

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




        page.pageCtrl = ["$scope", "sharedUi", "loadStatus", function($scope, sharedUi, loadStatus) {
            for (var k in params) {
                $scope[k] = params[k];
            }
            var xloadStatus = loadStatus.init($scope);

            var xsharedUi = sharedUi.init($scope, options.sharedUi);

            // add this here because the controller runs before the chondric-page directive
            $scope.usedComponents = {
                asArray: [],
                asString: ""
            };
            page.params = page.params || {};

            // add route parameters directly to the scope
            for (var k in page.params) {
                $scope[k] = page.params[k];
            }
            $scope.pageRoute = page.route;



            page.controller($scope, xsharedUi, xloadStatus);

            $scope.$watch("route", function(newVal, oldVal) {
                //console.log("Watch for " + $scope.pageRoute + " - Changed from " + oldVal + " to " + newVal);
                var newRoutes = (newVal || "").split(";");
                var oldRoutes = (oldVal || "").split(";");

                if (newRoutes.indexOf($scope.pageRoute) >= 0 && oldRoutes.indexOf($scope.pageRoute) < 0) {
                    // activated
                    page.activated($scope);
                    page.deactivationHandled = false;
                } else if (newRoutes.indexOf($scope.pageRoute) < 0 && oldRoutes.indexOf($scope.pageRoute) >= 0) {
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
        }];
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
