ChondricJS
==========

Chondric is a lightweight JavaScript MVC framework.

It provides the structure necessary for a single page app, but leaves the app pages behaving as much like standard html as possible.

A node.js update script handles the initial setup of a new app. Install with

    npm install -g chondric-tools

To start building a new app, create an app definition file (appdef.js). This can be created from a template with:

    chondric create

The app definition should look something like:

    {
        htmlPath: "apphtml",
        title: "App Name",
        appHost: "apphost",
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
        pageTemplate: "pagetemplate.html"
    }



To create the app from the definition, run

    chondric

This script can be run at any time to add new pages to the app - any files that already exist will be skipped, except for index.html which will be partially updated to keep page script references up to date.

To update referenced scripts, run

    bower install

If apphost is specified, an express based web server will be set up to make the contents of apphtml available in a browser. Settings are taken from a .env file. Run it with

    node apphost.js


## Development

Link the dev folder globally

    cd /git/ChondricJS/framework
    npm link
    
Link it in the app also

    cd /git/ChondricJS/example
    npm link chondric-tools

Add an environment variable to have scripts and css served directly from the chondric source rather than from the built version copied to the app folder.

    FRAMEWORK_DEBUG=true

Use node-dev to automatically restart the server if the code is changed

    node-dev apphost

## Client script

See the wiki for details of the browser development.
