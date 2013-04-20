app.createViewTemplate({
    templateId: "__PAGEID__",
    angularModules: __ANGULARMODULES__,
    initAngular: function() {
        var page = this;
        page.controllers = {
            __ANGULARCONTROLLER__: function($scope) {
                $scope.exampleValue = "Example";

                $scope.exampleFunction = function() {
                    $scope.exampleValue = '';
                };
            }
        };
    },
    updateModel: function(dataId, existingData, callback) {
        if (!this.model) this.model = this.getDefaultModel();
        var m = this.model;

        this.prev = "__PREVPAGEID__";
        this.next = "__NEXTPAGEID__";

        callback();
    },
    attachEvents: function() {

    },
    updateView: function() {

    },

});