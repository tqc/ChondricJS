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
                template += '<div loading-overlay></div></div>'

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
            element.addClass("sharedcomponent-" + cd.templateId);
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


Chondric.directive("cjsSharedHeader", function() {
    return {
        template: '<div class="v1" ng-style="{opacity:(1-globalHeaderOptions.transitionState), \'z-index\': ((globalHeaderOptions.transitionState > 0.5) ? 1: 2)  }"><button class="left" ng-repeat="b in globalHeaderOptions.v1.data.leftButtons" ng-tap="handleSharedHeaderButtonClick(globalHeaderOptions.v1, b, lastTap)">{{b.title}}</button><h1>{{globalHeaderOptions.v1.data.title}}</h1><button class="right" ng-repeat="b in globalHeaderOptions.v1.data.rightButtons" ng-tap="handleSharedHeaderButtonClick(globalHeaderOptions.v1, b, lastTap)">{{b.title}}</button></div>' + '<div class="v2" ng-style="{opacity:(globalHeaderOptions.transitionState), \'z-index\': ((globalHeaderOptions.transitionState > 0.5) ? 2: 1)}"><button class="left" ng-repeat="b in globalHeaderOptions.v2.data.leftButtons" ng-tap="handleSharedHeaderButtonClick(globalHeaderOptions.v2, b, lastTap)">{{b.title}}</button><h1>{{globalHeaderOptions.v2.data.title}}</h1><button class="right" ng-repeat="b in globalHeaderOptions.v2.data.rightButtons" ng-tap="handleSharedHeaderButtonClick(globalHeaderOptions.v2, b, lastTap)">{{b.title}}</button></div>',
        //        restrict: "E",
        link: function(scope, element, attrs) {
            var useOverlay = attrs.noOverlay === undefined;
            var horizontal = attrs.horizontal !== undefined;
            var menuwidth = parseFloat(attrs.menuwidth) || 280;
            var menuheight = parseFloat(attrs.menuheight) || 150;

            var useMouse = true;

            var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

            if (iOS) {
                useMouse = false;
            }


            element.addClass("navbar sharedheader");

            scope.$watch(attrs.cjsSharedHeader, function(val) {
                if (document.activeElement) document.activeElement.blur();

                if (!val) {
                    element.removeClass("active");
                } else {
                    element.addClass("active");
                }
            })

            var current = "v1";
            var other = "v2";



            scope.$watch('transition', function(transition, old) {

                /*
                var fromHeader = scope.headersForRoutes[transition.from];
                var toHeader = scope.headersForRoutes[transition.to];

                scope.globalHeaderOptions = scope.globalHeaderOptions || {};
                scope.globalHeaderOptions[current] = fromHeader;
                scope.globalHeaderOptions[other] = toHeader;

                $("." + other, element).css("opacity", transition.progress);
                $("." + current, element).css("opacity", 1 - transition.progress);



                if (transition.progress > 0.5) {
                    if (!toHeader) {
                        element.removeClass("active");
                    } else if (toHeader) {
                        element.addClass("active");
                        //                        $("." + other, element).show();
                        //                        $("." + current, element).hide();
                    }
                } else {
                    if (!fromHeader) {
                        element.removeClass("active");
                    } else if (fromHeader) {
                        element.addClass("active");
                        //            $("." + current, element).show();
                        //            $("." + other, element).hide();
                    }

                }

                if (transition.progress == 1) {
                    if (current == "v1") {
                        current = "v2";
                        other = "v1";
                    } else {
                        current = "v1";
                        other = "v2";
                    }
                }
                $("." + other, element).css("z-index", 1);
                $("." + current, element).css("z-index", 2);
*/

            }, true);

        }
    }
});