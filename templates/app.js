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
    updateNotificationSettings: function(deviceId, notificationsEnabled) {
        // send details to the notification server
    },
    notificationReceived: function(event) {
        if (event.foreground) {
            // app is already open
        } else {        
            // user opened the app with a notification
        }
    },
    customInit: function(callback) {
        app.registerForNotifications();
        callback();
    }
});

app.items = {};


$(function() {
    app.init();
});