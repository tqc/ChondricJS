/* jshint devel: true, browser: true */

Chondric.VersionedDatabase = function(db, updatefunctions, tables) {

    this.sqlerror = function(t, err) {
        if (err && err.message) throw new Error(err.message);
        else if (t && t.message) throw new Error(t.message);
        else if (err) {
            throw new Error(err);
        } else if (t) {
            throw new Error(t);
        } else {
            throw new Error("sql error");
        }
    };
    var sqlerror = this.sqlerror;

    var getVersion = function(versionCallback) {
        console.log("checking version");

        db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM settings where key=?", ["dbVersion"], function(t, result) {
                if (result.rows.length === 0) return versionCallback(0);
                var row = result.rows[0] || result.rows.item(0);
                window.setTimeout(function() {
                    return versionCallback(parseFloat(row.val));
                }, 0);
            }, function() {
                // error - no db
                window.setTimeout(function() {
                    versionCallback(0);
                }, 0);
            });
        }, function() {
            // error - no db
            window.setTimeout(function() {
                versionCallback(0);
            }, 0);
        });
    };

    this.updateDatabase = function(callback) {



        getVersion(function(currentVersion) {
            console.log("Current database version is " + currentVersion);

            var existingversion = currentVersion;

            var versionQueue = [];

            for (var vn in updatefunctions) {
                var vv = parseFloat(vn);
                if (existingversion < vv) {
                    versionQueue.push(vn);
                }
            }

            if (versionQueue.length === 0) return callback();

            db.transaction(function(tx) {
                for (var vn in updatefunctions) {
                    var vv = parseFloat(vn);
                    if (existingversion < vv) {
                        updatefunctions[vn](tx);
                        tx.executeSql('INSERT OR REPLACE INTO settings (key, val) VALUES (?, ?)', ["dbVersion", vv], null, sqlerror);
                        existingversion = vv;
                    }
                }
            }, sqlerror, function() {
                callback();
            });
        });
    };


    this.dropDatabase = function(callback) {
        db.transaction(function(tx) {
            for (var tn in tables) {
                tx.executeSql("DROP TABLE " + tn, [], null, sqlerror);
            }
        }, sqlerror, function() {
            callback();
        });
    };

    this.resetDatabase = function(callback) {
        var that = this;
        this.dropDatabase(function() {
            that.updateDatabase(callback);
        });
    };

};