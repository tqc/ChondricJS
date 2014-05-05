"use strict";
var fs = require("fs");
var path = require("path");

var chondric = require("./chondric-tools.js");

chondric.buildFramework(__dirname, function(frameworkjs, frameworkcss) {
    // todo: this won't work when installed globally - replace with seperate build script
    fs.writeFile(path.resolve(__dirname, "built/chondric.js"), frameworkjs);
    fs.writeFile(path.resolve(__dirname, "built/chondric.css"), frameworkcss);
});