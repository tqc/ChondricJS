export function chondricViewport($compile) {
    return {
        scope: true,
        link: function(scope, element, attrs) {
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

            if (!rk && attrs["chondric-viewport"] == "1") return;

            var template = "";
            if (!rv) {
                // first level
                element.addClass("chondric-viewport");
                //                template = "<div class=\"chondric-viewport\">"
                template = "<div ng-repeat=\"rv in openViewArray track by rv.route\" chondric-viewport=\"1\" class=\"{{rv.templateId}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rv.route == route, next: rv.route == nextRoute, prev: rv.route == lastRoute}\" cjs-transition-style route=\"{{rv.route}}\">";
                template += "</div>";
                template += "<div ng-repeat=\"(ck, componentDefinition) in sharedUiComponents track by ck\" cjs-shared-component testattr='{{componentId}}'>";
                template += "</div>";

                //                template += "</div>"

            } else if (rv.isSection) {
                template = "<div ng-controller=\"rv.controller\" >";
                template += "<div ng-repeat=\"rv in rv.subsectionArray | orderBy:'position' track by rv.route \" chondric-viewport=\"1\" class=\"{{rv.templateId}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rv.route == route, next: rv.route == nextRoute, prev: rv.route == lastRoute}\" cjs-transition-style position=\"{{rv.position}}\" route=\"{{rv.route}}\">";
                template += "</div>";
                template += "</div>";

            } else if (rv.templateUrl) {
                template = "<div  ng-controller=\"rv.controller\" cjs-swipe class=\"{{usedComponents.asString}}\"> <div ng-include src=\"rv.templateUrl\"></div>";
                template += '</div>';
                scope.usedComponents = {
                    asArray: [],
                    asString: ""
                };

            } else if (rv.template) {
                template = "<div  ng-controller=\"rv.controller\" class=\"{{usedComponents.asString}}\">";
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
        }
    };
}
