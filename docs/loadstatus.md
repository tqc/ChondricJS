#Loading status

## App loading
Handled at the viewport level. Before angular is initialized, css on .viewport.unloaded is used to display a simple loading image.

While the init task is running, the viewport directive will display a progress message instead of the active page.

## Section loading
If a section is set to display, e.g. as an accordion, pages should not be displayed until the section load task is complete.

Note that pages can safely be instantiated, as their load tasks will naturally depend on the section load task.

## Page loading
The page does not have the necessary data to display anything. 

Probably makes sense to handle in the framework rather than requiring all pages to have a top level overlay directive.

## Panel loading

Used when a page level task is loading, but parts of the page can be displayed.

#Implementation Notes

Requiring a task to complete at app, section, or page level is done by setting  `$scope.requiredTask = "taskName";`. This means than every page defaults to requiring the app and section load tasks.



