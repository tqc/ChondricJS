Chondric.registerSharedUiComponent({
    id: "cjs-left-panel",
    baseComponentId: "cjs-right-panel",
    templateUrl: "cjs-left-panel.html",
    handledSwipeState: "leftBorder",
    transition: "coverLeft",
    controller: function($scope) {
        var self = $scope.componentDefinition;
        self.baseController("cjs-right-panel", $scope);
    },
    setPanelPosition: function(self, progress) {
        self.popuptrigger = {
            progress: progress,
            transition: "coverLeft"
        };
    },
});