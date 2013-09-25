var chondric = require("../chondric-tools.js");
//var chondric = require("chondric-tools");

var settings = {
    htmlPath: "apphtml",
    title: "ChondricJS Example App", // Edit this
    useAngular: true,
    appHost: "apphost", // use something unique here if you need to run multiple apps with forever
    pages: [
        {
            id: "start",
            title: "Start Page"
        },
        {
            id: "page2",
            title: "Second Page"
        },
        {
            id: "page3",
            title: "Default Page"
        }
        ],
    pageTemplate: "pagetemplate.html" // remove this if you want to create pages with the default template
};

chondric.update(settings);



