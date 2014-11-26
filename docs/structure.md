#App structure

An app has two components, the client app and a server app. Both are implemented in ES6.

##Server app
The server app, by default in `./serverapp/index.js` is an express based web app written with es6 and compiled with traceur to `./build/serverapp`

The default implementation simply calls express.static to serve the client app build folder as `/app`.

The entry point is a single es5 file `./server.js`. This file contains only one line:

    require("build/serverapp");

This allows the app to read the .env file from the root folder and to access supporting files such as ssl keys specified relative to the app root folder rather than relative to the build folder.

##Client app
The client app, by default in `./clientapp` is also written in modular es6 format. It will be compiled using browserify and es6ify into `./build/clientapp`. 

###Entry point
The main part of the app, `app.js`, is a module that exports an app class that extends Chondric.App.

The entry point of the app is a simpler file, responsible for instantiating the app object and starting it.

    var app = new App.App({
        title: "Test new app"
    });
    window.app = app;
    app.start();

Multiple entry points may be used to build variations of the app, for example one for web and one to be packaged as a native app. Some of the parameters for the app may be modules - this means that the entry point can import functionality that will only be compiled for that variation.

For example

web.js

    var app = new App.App({
        title: "Test new app",
        api: require("./webapi")
    });

native.js

    var app = new App.App({
        title: "Test new app",
        api: require("./nativeapi")
    });


### Browserify customizations

Stringify - When defining a page or angular directive, use

    template: require("./template.html")

The html from the template file will be minified and included as a string in the built package.

Remapify - To avoid excessive `../` The folowing path aliases can be used in require/import statments:

* `chondric` - maps to `node_modules/chondric-tools/es6`
* `app` - maps to  `clientapp`
* `pages` - maps to `clientapp/pages`


