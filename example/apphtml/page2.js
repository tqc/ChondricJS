app.createViewTemplate({
    templateId: "page2",
    angularModules: [],
    initAngular: function() {
        var page = this;
        page.controllers = {
            page2Ctrl: function($scope) {
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

     //   this.prev = "start";
        this.next = "";

        callback();
    },
    attachEvents: function() {

    },
    updateView: function() {

    },

});