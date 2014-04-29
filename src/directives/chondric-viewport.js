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
                element.addClass("chondric-viewport");
                //                template = "<div class=\"chondric-viewport\">"
                template = "<div ng-repeat=\"(rk, rv) in openViews\" chondric-viewport=\"1\" class=\"{{rv.templateId}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute}\" cjs-transition-style route=\"{{rk}}\">"
                template += "</div>"
                template += '<div cjs-popover="globalPopupMenu"><div class="poparrow"></div><button ng-repeat="b in globalPopupMenu.items" ng-tap="globalPopupMenu.scope.$eval(b.action)">Button</button></div>'
                template += '<div cjs-shared-header="globalHeaderOptions"></div>'



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


Chondric.directive("cjsSharedHeader", function() {
    return {

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
            element.html("<h1>Shared Header Stuff here</h1>");

            scope.$watch(attrs.cjsSharedHeader, function(val) {
                if (document.activeElement) document.activeElement.blur();

                if (!val) {
                    element.removeClass("active");
                } else {
                    element.addClass("active");
                }
            })

            scope.$watch('transition', function(transition, old) {
                var fromHeader = scope.headersForRoutes[transition.from];
                var toHeader = scope.headersForRoutes[transition.to];
                if (transition.progress > 0.5) {
                    if (!toHeader) {
                        element.removeClass("active");
                    } else if (toHeader) {
                        element.addClass("active");
                        $("h1", element).html(toHeader.title);
                    }
                } else {
                    if (!fromHeader) {
                        element.removeClass("active");
                    } else if (fromHeader) {
                        element.addClass("active");
                        $("h1", element).html(fromHeader.title);
                    }

                }

            }, true);

        }
    }
});