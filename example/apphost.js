var chondric = require("../chondric-tools");
require("envloader").load();

var app = chondric.hostApp({
    settingsJson: function(req, res) {
        res.json({
            debug: true
        });
    }
});
