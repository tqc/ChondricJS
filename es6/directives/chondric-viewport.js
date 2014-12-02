export function chondricViewport($compile) {
    return {
        scope: true,
        template: require("./chondric-viewport.html"),
        link: function(scope, element, attrs) {
            // clean up the generated html a little
            element.removeAttr("chondric-viewport");
            element.removeAttr("data-chondric-viewport");


            //            console.log("viewport directive");
            var rv = scope.$eval("rv");
            var rk;
            if (rv) {
                scope.rk = rk = rv.route;
                scope.pageParams = rv.params || {};
                // add route parameters directly to the scope
                for (var k in rv.params) {
                    scope[k] = rv.params[k];
                }
            }
            if (rk) scope.pageRoute = rk;
            element.addClass("chondric-viewport");

/*
            if (!rk && attrs["chondric-viewport"] == "1") return;

            var template = "";
            if (!rv) {
                // first level
                element.addClass("chondric-viewport");
                //                template = "<div class=\"chondric-viewport\">"
                template = "<div ng-repeat=\"rv in openViewArray track by rv.route\" ng-if=\"route.indexOf(rv.route) == 0\" chondric-viewport=\"1\" class=\"chondric-page {{rv.templateId}}\" ng-class=\"{active: rv.route == route, next: rv.route == nextRoute, prev: rv.route == lastRoute, block: rv.isBlockPage}\" cjs-transition-style route=\"{{rv.route}}\">";
                template += "</div>";
                template += "<div ng-repeat=\"(ck, componentDefinition) in sharedUiComponents track by ck\" cjs-shared-component testattr='{{componentDefinition.componentId}}'>";
                template += "</div>";

                //                template += "</div>"

            } else if (rv.template) {
                template = "<div ng-controller=\"rv.pageCtrl\" class=\"{{usedComponents.asString}}\">";
                template += rv.template;
                template += '</div>';
                scope.usedComponents = {
                    asArray: [],
                    asString: ""
                };
            } else {
                template = "<span>Template not set</span>";
            }

            var newElement = angular.element(template);
            $compile(newElement)(scope);
            element.html("");
            element.append(newElement);
            */
        }
    };
}
