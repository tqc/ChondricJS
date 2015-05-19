export class Page {
    constructor(route, params, options) {
        options = options || {            
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
        if (options.fixedTemplate) this.fixedTemplate = options.fixedTemplate;

        this.preloadContent = options.preloadContent || require("./preload.html");

        var page = this;


        page.pageCtrl = ["$scope", "sharedUi", "loadStatus", function($scope, sharedUi, loadStatus) {
            for (let k in params) {
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
            for (let k in page.params) {
                $scope[k] = page.params[k];
            }
            $scope.pageRoute = page.route;



            page.controller($scope, xsharedUi, xloadStatus);

            $scope.$watch("route", function(newVal, oldVal) {
                //console.log("Watch for " + $scope.pageRoute + " - Changed from " + oldVal + " to " + newVal);

                if (newVal == oldVal) {
                    // this can only happen when the watch is first created - i.e. activating the page triggered
                    // page creation and loading this controller.
                    oldVal = null;
                }

                var newRoutes = (newVal || "").split(";");
                var oldRoutes = (oldVal || "").split(";");

                var matchRoute = function(val) {
                    if (val && val.indexOf($scope.pageRoute) === 0) return true;
                    return false;
                };

                var wasActive = oldRoutes.filter(matchRoute).length > 0;
                var isActive = newRoutes.filter(matchRoute).length > 0;


                if (isActive && !wasActive) {
                    // activated
                    page.activated($scope);
                    page.deactivationHandled = false;
                } else if (wasActive && !isActive) {
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
    initSharedUiComponents(app, sharedUiOptions) {
            this.app = app;
            sharedUiOptions = sharedUiOptions || {};
            for (let k in sharedUiOptions) {
            var componentId = sharedUiOptions[k];
            var component = app.sharedUiComponents[componentId];
            if (!component) {
                throw new Error(
                    "Shared UI Component " + componentId + " not found"
                );
            }

            var csfr = app.componentStatesForRoutes[this.route] = app.componentStatesForRoutes[this.route] || {};
            csfr[componentId] = csfr[componentId] || {
                route: this.route,
                active: false,
                available: true,
                data: {}
            };

        }
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
