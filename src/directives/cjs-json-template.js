Chondric.directive("cjsJsonTemplate", function($compile) {

    var templates = {
        container: function(template) {
            var html = "";
            for (var i = 0; i < template.children.length; i++) {
                html += templates[template.children[i].type](template.children[i]);
            }
            return html;
        },
        body: function(template) {
            var html = "";
            for (var i = 0; i < template.children.length; i++) {
                html += templates[template.children[i].type](template.children[i]);
            }
            return "<div class='body'>" + html + "</div>";
        },
        h2: function(template) {
            return "<h2>{{data." + template.data + "}}</h2>";
        },
        p: function(template) {
            return "<p>{{data." + template.data + "}}</p>";
        }
    };


    return {

        //        restrict: "E",
        template: "Testing a template...",
        scope: {
            template: "=cjsJsonTemplate"
        },
        link: function(scope, element, attrs) {

            var template = scope.template;
            var html = templates[template.type](template);
            var newElement = angular.element(html);
            $compile(newElement)(scope);
            element.html("");
            element.append(newElement);

            scope.$parent.$watch(attrs.data, function(val) {
                scope.data = val;
            });
        }
    };
});