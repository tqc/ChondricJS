app.createViewTemplate({
    templateId: "start",
    angularModules: [],
    controller: function($scope) {
                $scope.exampleValue = "Example";

                $scope.exampleFunction = function() {
                    $scope.exampleValue = '';
                };
            },
    updateModel: function(dataId, existingData, callback) {
        if (!this.model) this.model = this.getDefaultModel();
        var m = this.model;

     //   this.prev = "";
     //   this.next = "page2";

        callback();
    },
    attachEvents: function() {

    },
    updateView: function() {

    },

});