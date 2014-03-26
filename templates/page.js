app.createViewTemplate({
    templateId: "__PAGEID__",
    route: "__PAGEROUTE__"
    controller: function($scope) {
        page.scope = $scope;
        var m = $scope.m = page.model;
        $scope.exampleValue = "Example";

        $scope.exampleFunction = function() {
            $scope.exampleValue = '';
        };
    },
    controllers: {}
});