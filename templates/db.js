function ExampleDb() {

    var db;
    if (app.isPhonegap) {
        console.log("using native db");
        db = sqlitePlugin.openDatabase("ExampleDb", "", "Example local database", 1000000);

    } else {
        console.log("Using web db");
        db = openDatabase("ExampleDb", "", "Example local database", 1000000);
    }

    if (!db) {
        alert("Failed to connect to database.");
    }
    var dbwrapper = this;

    var updatefunctions = {
        "0.01": function(tx) {
            tx.executeSql("CREATE TABLE settings (key TEXT UNIQUE, val TEXT)", [], null, dbwrapper.sqlerror);
        },
        "0.03": function(tx) {
            tx.executeSql("CREATE TABLE items (itemName TEXT UNIQUE , data TEXT)", [], null, dbwrapper.sqlerror);
        }
    };

    var tables = ["settings", "items"];

    Chondric.VersionedDatabase.apply(this, [db, updatefunctions, tables]);

    var sqlerror = this.sqlerror;

    /**************************************************************************************
     * Get Items
     **************************************************************************************/

    this.getItems = function(callback) {
        var items = {};
        db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM items", [], function(t, result) {
                for (var i = 0; i < result.rows.length; i++) {
                    var row = result.rows[i] || result.rows.item(i)
                    items[row.itemName] = JSON.parse(row.data);
                }
                if (callback != null) callback(items);
            }, sqlerror);
        });
    };

    this.saveItem = function(item, callback) {
        db.transaction(function(tx) {
            tx.executeSql('INSERT OR REPLACE INTO items (itemName, data) VALUES (?, ?)', [item.itemName, JSON.stringify(item)], function() {
                callback();
            }, sqlerror);
        }, sqlerror);
    };

    this.deleteMockup = function(itemName, callback) {

        db.transaction(function(tx) {
            tx.executeSql('DELETE FROM items where itemName = ?', [itemName], function() {
                callback();
            }, sqlerror);
        }, sqlerror);
    };



}