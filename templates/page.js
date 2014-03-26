app.createViewTemplate({
    templateId: "__PAGEID__",
    route: "__PAGEROUTE__",
    controller: function($scope) {
        $scope.exampleValue = "Example";

        $scope.exampleFunction = function() {
            $scope.exampleValue = '';
        };
    },
    controllers: {}
});