export default["$timeout", function loadStatusFactory($timeout) {
    // simple UI to track loading status
    return {
        init: function($scope, initialTasks) {
            var service = {};
            var existing = $scope.loadStatus;
            if (existing) {
                angular.extend(service, existing);
                service.allTasks = [].concat(existing.allTasks);

            } else {
                service.allTasks = [];
            }
            $scope.loadStatus = service;

            service.registerTask = function(key, taskOptions) {
                var task = {
                    key: key,
                    title: "Untitled Task",
                    progressCurrent: 0,
                    progressTotal: 1,
                    active: false,
                    message: "",
                    error: null,
                    start: function(message) {
                        $timeout(function() {
                            task.message = message || "";
                            task.active = true;
                            task.error = null;
                            task.progressCurrent = 0;
                            task.completed = false;
                        });
                    },
                    finish: function(message) {
                        $timeout(function() {
                            task.message = message || "";
                            task.progressCurrent = task.progressTotal;
                            task.completed = true;
                            task.active = false;
                        });
                    },
                    fail: function(message) {
                        $timeout(function() {
                            task.active = false;
                            task.error = message;
                            task.completed = false;
                        });
                    },
                    progress: function(progress, total, message) {
                        $timeout(function() {
                            task.active = true;
                            task.progressCurrent = progress;
                            if (total !== undefined) task.progressTotal = total;
                            if (message !== undefined) task.message = message;
                        });
                    }
                };
                angular.extend(task, taskOptions);
                service[key] = task;
                service.allTasks.push(task);
            };

            service.onUpdate = function(tasksOrKeys, fn) {
                // if no task array specified, include all tasks in the current scope
                tasksOrKeys = tasksOrKeys || service.allTasks;
                var watchedKeys = [];
                for (let i = 0; i < tasksOrKeys.length; i++) {
                    var t = tasksOrKeys[i];
                    if (typeof t == "string") watchedKeys.push(t);
                    else if (t.key) watchedKeys.push(t.key);
                }
                if (watchedKeys.length === 0) return fn({
                    tasks: [],
                    completed: true
                });

                $scope.$watch("[loadStatus." + watchedKeys.join(",loadStatus.") + "]", function(newTasks) {
                    // check all tasks, see if there are any outstanding
                    if (!newTasks) return;

                    var result = {
                        tasks: newTasks
                    };

                    result.currentTask = undefined;
                    for (var i = 0; i < newTasks.length; i++) {
                        var task = newTasks[i];
                        if (task.error) {
                            result.currentTask = task;
                            break;
                        }

                        if (task.active) {
                            result.currentTask = task;
                            break;
                        }
                        if (task.progressCurrent < task.progressTotal && (!result.currentTask || task.progressTotal > result.currentTask.progressTotal)) {
                            result.currentTask = task;
                            break;
                        }
                    }
                    if (!result.currentTask) {
                        // finished
                        result.message = "finished";
                        result.completed = true;
                    } else {
                        result.completed = false;
                        result.title = result.currentTask.title;
                        result.error = result.currentTask.error;
                        result.message = result.currentTask.message || (result.currentTask.progressCurrent + " / " + result.currentTask.progressTotal);
                    }

                    fn(result);

                }, true);

            };

            service.after = function(tasksOrKeys, fn) {
                service.onUpdate(tasksOrKeys, function(taskGroup) {
                    if (taskGroup.completed) return fn();
                });
            };

            if (initialTasks) {
                for (var tk in initialTasks) {
                    service.registerTask(tk, initialTasks[tk]);
                }
            }
            return service;
        }
    };
}];
