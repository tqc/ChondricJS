Chondric.directive('chondricViewport', function($compile) {
    return {
        //    restrict: 'E',
        //    terminal: true,
        //scope: { val: '=', parentData:'=' },
        link: function(scope, element, attrs) {
            console.log("viewport directive");
            var rk = scope.$parent.rk;
            var rv = scope.$parent.rv;
            var template = "";
            if (!rv) {
                // first level
                element.addClass("chondric-viewport");
                template = "<div chondric-viewport class=\"{{transition}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute, notransition: noTransition}\" ng-repeat=\"(rk, rv) in openViews\" route=\"{{rk}}\" ng-controller=\"rv.controller\"></div>"
            } else if (rv.isSection) {
                scope.pageParams = rv.params || {};
                template = "<div chondric-viewport class=\"{{transition}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute, notransition: noTransition}\" ng-repeat=\"(rk, rv) in rv.subsections\" route=\"{{rk}}\" ng-controller=\"rv.controller\"></div>"
            } else if (rv.templateUrl) {
                scope.pageParams = rv.params || {};
                template = "<div ng-include src=\"rv.templateUrl\"></div>";
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