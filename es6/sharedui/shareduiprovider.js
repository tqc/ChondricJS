export default function sharedUiFactory() {
    // A simplified interface for the shared ui components

    return {
        init: function($scope, componentAliases) {
            var service = {};
            var app = $scope.app;
            service.route = $scope.page.route;
            $scope.sharedUi = service;
            service.addComponent = function(alias, componentKey) {
                service[alias] = {
                    setState: function(active, available, data) {
                        app.setSharedUiComponentState($scope, componentKey, active, available, data);
                    },
                    enable: function(data) {
                        app.setSharedUiComponentState($scope, componentKey, undefined, true, data);
                    },
                    disable: function() {
                        app.setSharedUiComponentState($scope, componentKey, false, false, undefined);
                    },
                    show: function(data) {
                        app.setSharedUiComponentState($scope, componentKey, true, true, data);
                    },
                    hide: function(disable) {
                        app.setSharedUiComponentState($scope, componentKey, false, !disable, undefined);
                    },
                    replaceData: function(data) {
                        app.setSharedUiComponentState($scope, componentKey, undefined, undefined, data);
                    },
                    extendData: function(update) {
                        var state = app.getSharedUiComponentState($scope, componentKey);
                        var newData = $.extend(state.data || {}, update);
                        app.setSharedUiComponentState($scope, componentKey, state.active, state.available, newData);
                    },
                    updateState: function(fn) {
                        var state = app.getSharedUiComponentState($scope, componentKey);
                        fn(state);
                        app.setSharedUiComponentState($scope, componentKey, state.active, state.available, state.data);
                    }

                };
            };

            for (var alias in componentAliases) {
                service.addComponent(alias, componentAliases[alias]);
            }
            return service;
        }
    };
}