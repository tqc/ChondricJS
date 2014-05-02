// add a loading overlay if the scope has dataLoadStatus.waitingForData set.
// if dataLoadStatus.error is set, it will be displayed as an error message.
// if dataLoadStatus.retry is a function, a button wil be displayed
// if dataLoadStatus.cancel is set, a button will be displayed.
Chondric.directive('cjsLoadingOverlay', function($compile) {
    return {
        replace: true,
        templateUrl: "cjs-loading-overlay.html"
    }
});

Chondric.directive('cjsShowAfterLoad', function($compile) {
    return {
        restrict: 'A',
        scope: {
            cjsShowAfterLoad: "="
        },
        link: function(scope, element, attrs) {
            var contents = element.contents();

            var contentElement = angular.element(element[0].outerHTML);
            contentElement.removeAttr("cjs-show-after-load");
            contentElement.attr("ui-toggle", "!currentTask");

            var overlay = angular.element("<div>Loading ({{message}})</div>")
            overlay.attr("ui-toggle", "currentTask");

            var wrapper = angular.element("<div></div>");
            wrapper.append(overlay);
            wrapper.append(contentElement);
            $compile(wrapper)(scope);
            element.replaceWith(wrapper);
            scope.$watch("cjsShowAfterLoad", function(status) {
                if (!status) return;
                var currentTask = null;
                for (var i = 0; i < status.tasks.length; i++) {
                    var task = status.tasks[i];
                    if (task.error) {
                        currentTask = task;
                        break;
                    }
                    if (task.progressCurrent < task.progressTotal && (!currentTask || task.progressTotal > currentTask.progressTotal)) {
                        currentTask = task;
                    }
                }

                scope.currentTask = currentTask;
                if (!currentTask) {
                    // finished
                    scope.message = "finished";
                } else if (currentTask.error) {
                    scope.message = "error";
                } else {
                    scope.message = currentTask.progressCurrent + " / " + currentTask.progressTotal;
                }



            }, true)

        }
    };
});