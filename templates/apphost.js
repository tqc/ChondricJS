/* jshint unused: false */
"use strict";
var chondric = require("chondric-tools");

require("envloader").load();

var app = chondric.hostApp({
    frameworkDebug: process.env.FRAMEWORK_DEBUG ? {} : false,
    settingsJson: function(req, res) {
        res.json({
            debug: true
        });
    }
});