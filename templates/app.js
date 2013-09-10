var app = new Chondric.App({
    name: "__TITLE__",
    mightBePhoneGap: true,
    scriptGroups: [],
    angularModules: [],
    firstPageTemplate: "__FIRSTPAGETEMPLATE__",
    firstPageDataId: "",
    getDatabase: function() {
        return new ExampleDb();
    },
    loadData: function(loadedctx, callback) {
        console.log("loading data");
        app.db.getItems(function(items) {
            console.log("items loaded");
            app.items = items;
            callback();
        });

    },
    customInit: function(callback) {
        callback();
    },
    enableScroll: true
});

app.items = {};


$(function() {
    app.init();
});