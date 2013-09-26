//var chondric = require("../../ChondricJS/chondric-tools.js");
var chondric = require("chondric-tools");

var settings = {
    htmlPath: "apphtml",
    title: "App Title", // Edit this
    useAngular: true,
    appHost: "apphost", // use something unique here if you need to run multiple apps with forever
    pages: [
        {
            id: "start",
            title: "Start"
        },
        {
            id: "staticpage",
            title: "Scriptless Content Page",
            scriptless: true;
        }
        ],
    pageTemplate: "pagetemplate.html" // remove this if you want to create pages with the default template
};

chondric.update(settings);



