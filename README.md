ChondricJS
==========

Chondric is a lightweight JavaScript MVC framework. 

It provides the structure necessary for a single page app, but leaves the app pages behaving as much like standard html as possible.

A node.js update script handles the initial setup of a new app. Install with

    npm install chondric-tools

To start building a new app, create an app definition file (appdef.js)

    var chondric = require("chondric-tools");
    
    var settings = {
        htmlPath: "apphtml",
        title: "App Name",
        pages: [
            {
                id: "firstpage",
                title: "First Page"
            },
            {
                id: "secondpage",
                title: "Second Page"
            }
        ],
        pageTemplate: "pagetemplate.html" // optional - a default template will be used if omitted
    }

    chondric.update(settings);


run with

    node appdef.js

This script can be run at any time to add new pages to the app - any files that already exist will be skipped, except for index.html which will be partially updated to keep page script references up to date.

See the wiki for details of the browser development.