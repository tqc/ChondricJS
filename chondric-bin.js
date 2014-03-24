#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var mkdirp = require("mkdirp");
var pkg = require(path.join(__dirname, 'package.json'));
var chondric = require("./chondric-tools.js")

process.bin = process.title = 'chondric';
process.stdout.write(pkg.version + '\n');


    var chondricdir = __dirname;
    var apphostdir = process.cwd();
    var appdefpath = path.resolve(apphostdir, "appdef.json");

    console.log("init in " + apphostdir);

    if (fs.existsSync(appdefpath)) {
        console.log("appdef.json already exists");
        var appdef = require(path.join(apphostdir, 'appdef.json'));
        chondric.update(apphostdir, appdef);
    } else {
        var template = fs.readFileSync(path.resolve(chondricdir, "templates/appdef.json"));
        fs.writeFileSync(appdefpath, template);
        console.log("Created appdef.json");
        console.log("Edit and run again to create the app");
    }
