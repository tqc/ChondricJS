Chondric.directive('chondricViewport', function($compile) {
    return {
        scope: true,
        link: function(scope, element, attrs) {
            //            console.log("viewport directive");
            var rk = scope.$eval("rk");
            var rv = scope.$eval("rv");
            if (rv) scope.pageParams = rv.params || {};
            if (rk) scope.pageRoute = rk;

            if (!rk && attrs["chondric-viewport"] == "1") return;

            var template = "";
            if (!rv) {
                // first level
                scope.handleSharedPopupButtonClick = function(b) {
                    var options = scope.globalPopupMenu;
                    scope.hideModal("globalPopupMenu")
                    if (b.action) {
                        options.scope.$eval(b.action)
                    }
                }
                element.addClass("chondric-viewport");
                //                template = "<div class=\"chondric-viewport\">"
                template = "<div ng-repeat=\"(rk, rv) in openViews\" chondric-viewport=\"1\" class=\"{{rv.templateId}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute}\" cjs-transition-style route=\"{{rk}}\">"
                template += "</div>"
                template += "<div ng-repeat=\"(ck, componentDefinition) in sharedUiComponents\" cjs-shared-component>"
                template += "</div>"

                //                template += "</div>"

            } else if (rv.isSection) {
                template = "<div ng-controller=\"rv.controller\" >"
                template += "<div ng-repeat=\"(rk, rv) in rv.subsections\" chondric-viewport=\"1\" class=\"{{rv.templateId}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute}\" cjs-transition-style route=\"{{rk}}\">"
                template += "</div>"
                template += "</div>"

            } else if (rv.templateUrl) {
                template = "<div  ng-controller=\"rv.controller\" cjs-swipe> <div ng-include src=\"rv.templateUrl\"></div>";
                template += '<div cjs-loading-overlay></div></div>'

            } else {
                template = "<span>Template not set</span>"
            }

            var newElement = angular.element(template);
            $compile(newElement)(scope);
            element.html("");
            element.append(newElement);
        }
    }
});

Chondric.directive('cjsSharedComponent', function($compile) {
    return {
        scope: true,
        link: function(scope, element, attrs) {
            var cd = scope.componentDefinition;
            element.addClass("sharedcomponent-" + cd.id);
            var template = "";
            template += "<div ng-controller=\"componentDefinition.controller\" >"
            if (cd.template) {
                template += cd.template;
            } else if (cd.templateUrl) {
                template += "<div ng-include src=\"componentDefinition.templateUrl\"></div>";
            }
            template += "</div>"

            var newElement = angular.element(template);
            $compile(newElement)(scope);
            element.html("");
            element.append(newElement);
        }
    }
});