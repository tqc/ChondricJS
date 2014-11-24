export function cjsSharedComponent($compile) {
    return {
        scope: true,
        link: function(scope, element) {
            var cd = scope.componentDefinition;
            // no need to create html elements when using the native implementation
            if (cd.isNative && cd.isNative()) return;
            element.addClass("sharedcomponent-" + cd.id);
            var template = "";
            template += "<div ng-if='!componentDefinition.isNative()' ng-controller=\"componentDefinition.controller\" >";
            if (cd.template) {
                template += cd.template;
            } else if (cd.templateUrl) {
                template += "<div ng-include src=\"componentDefinition.templateUrl\"></div>";
            }
            template += "</div>";

            var newElement = angular.element(template);
            $compile(newElement)(scope);
            element.html("");
            element.append(newElement);
        }
    };
}