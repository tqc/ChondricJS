#Initialization process

The html file includes the script bundle app.js. The entry point instantiates a new app object and calls app.start().

## Constructor
Set basic app parameters
Register directives, components etc.
No data or scope yet available - functions can be defined, but nothing should run.

# Start
Base class function, not intended to be overridden. Defines the app controller and calls angular.bootstrap, which will run the app controller.

## App controller `app.appCtrl($scope)`

Initialize stuff on the app scope. Everything here is synchronous. 

As well as scope, appCtrl may have additional parameters which can be injected using the standard angular method (strict version).
for example:

    app.additionalInjections = ["$compile"]
    ...
    appCtrl($scope, $compile) {...}

Some stuff is added to the scope before the custom controller function is called.

# App loading task
An app loading task is registered in the shared controller.

app.initApp(callback)

# Start page