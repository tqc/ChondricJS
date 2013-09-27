var app = new Chondric.App({
    name : "ChondricJS Example App",
    mightBePhoneGap: true,
    scriptGroups : [],
    angularModules: [],
    firstPageTemplate: "start",
    firstPageDataId: "",
    getDatabase : function() {
        return new ExampleDb();
    },
    loadData : function(loadedctx, callback) {
        console.log("loading data");



        app.db.getItems( function(items) {

            console.log("items loaded");
            app.items = items;

                                        callback();
        });

    },
    customInit : function(callback) {
        callback()
    },
    enableScroll : true
})

app.items = {};


$(function() {
app.init();
});

