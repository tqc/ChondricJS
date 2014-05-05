Chondric.Syncable = function(options) {
    var syncable = this;

    var localIndex = {};
    var remoteIndex = {};

    var settings = syncable.settings = {
        bulkSave: false,
        saveAllToDb: function(localIndex) {},
        saveToDb: function(wrapper) {},
        removeFromDb: function(wrapper) {},
        getRemoteId: function(remoteVersion) {
            return remoteVersion.key;
        },
        merge: function(wrapper, callback) {
            // todo: default merge implementation
            // todo: merge instead of overwriting local changes 
            if (!wrapper.localId) wrapper.localId = wrapper.remoteId;

            if (!wrapper.hasLocalChanges) {
                wrapper.localVersion = wrapper.unmergedRemoteVersion;
            }

            if (wrapper.unmergedRemoteVersion) {
                wrapper.remoteVersion = wrapper.unmergedRemoteVersion;
                delete wrapper.unmergedRemoteVersion;
            }
            if (wrapper.remoteVersion) {
                wrapper.remoteId = settings.getRemoteId(wrapper.remoteVersion);
            }

            callback();
        },
        upload: function(wrapper, callback) {
            callback();
            // todo: post update
            //                                app.coreApiPost("/servers/", "", function(ns) {

            //                              })
            //                            projectSource.uploadIssue(project, wrapper, onProgress, callback);

        }
    };

    $.extend(settings, options);


    syncable.updateIndex = function(wrapper) {
        if (wrapper.remoteId) remoteIndex[wrapper.remoteId] = wrapper;
        if (wrapper.localId) localIndex[wrapper.localId] = wrapper;
    };

    // return wrapper object as it exists - local, remote or both may be unset.
    // if a new wrapper is created it will be created with the known remote id.

    syncable.getByRemoteId = function(id, callback) {
        if (remoteIndex[id]) {
            return callback(remoteIndex[id]);
        } else {
            var wrapper = {
                remoteId: id
            };
            return callback(wrapper);
        }
    };

    // local id should always be valid
    syncable.getByLocalId = function(id, callback) {
        return callback(localIndex[id]);
    };

    syncable.addNew = function(localId, localVersion) {
        var wrapper = {
            localId: localId,
            localVersion: localVersion,
            hasLocalChanges: true,
            lastModified: new Date().getTime()
        };
        syncable.updateIndex(wrapper);
        return wrapper;
    };

    syncable.save = function(wrapper) {
        syncable.updateIndex(wrapper);
        if (settings.bulkSave) {
            settings.saveAllToDb(localIndex);
        } else {
            settings.saveToDb(wrapper);
        }
    };

    syncable.queueSave = function(wrapper, lastModified, isSystemUpdate) {
        // todo: timer implementation / single bulk save
        if (!isSystemUpdate) wrapper.hasLocalChanges = true;
        wrapper.lastModified = lastModified || new Date().getTime();
        syncable.save(wrapper);

    };

    // ensure all are in the in memory list. 
    // db is not independently accessible, so no need to load any that are already present
    syncable.loadFromDbResults = function(wrappers) {
        for (var i = 0; i < wrappers.length; i++) {
            var wrapper = wrappers[i];
            if (wrapper.remoteId && remoteIndex[wrapper.remoteId]) continue;
            if (wrapper.localId && localIndex[wrapper.localId]) continue;
            syncable.updateIndex(wrapper);
        }
    };


    syncable.loadSavedLocalIndex = function(data) {
        localIndex = data;
        for (var li in data) {
            syncable.updateIndex(data[li]);
        }
    };


    syncable.sync = function(
        // object needing sync
        wrapper,
        // function to get latest version from remote. can either call web service directly or use cached results from 
        // a getAll web service. should return null if remoteId is not set.
        getRemoteVersion,
        // function to perform a 3 way merge. May create localVersion if it doesn't exist, but must use 
        // existing object if it is set. 
        mergeFunction,
        // function to upload the local version to the remote. returns the updated remote version
        uploadFunction,
        callback) {

        getRemoteVersion(wrapper.remoteId, function(newRemoteVersion) {

            wrapper.unmergedRemoteVersion = newRemoteVersion;

            (mergeFunction || settings.merge)(wrapper, function() {
                // wrapper must now have local version set.
                // if merge changed anything, hasLocalChanges will be true
                syncable.updateIndex(wrapper);
                if (wrapper.hasLocalChanges) {
                    uploadFunction(wrapper, function() {
                        // this may update remote id and unmergedRemoteVersion, and should set hasLocalChanges to false if it succeeded.
                        (mergeFunction || settings.merge)(wrapper, function() {
                            syncable.updateIndex(wrapper);
                            syncable.queueSave(wrapper, wrapper.lastModified, true);
                            callback();
                        });
                    });
                } else {
                    syncable.queueSave(wrapper, wrapper.lastModified, true);
                    callback();
                }
            });

        });
    };


    // process multiple remote objects as an object containing remoteId:remoteVersion pairs
    syncable.syncRemoteIndex = function(remoteObjects, callback) {

        // get array of keys
        var keys = [];
        for (var rk in remoteObjects) {
            keys.push(rk);
        }


        var processItem = function(i) {
            if (i >= keys.length) return callback();

            syncable.getByRemoteId(keys[i], function(wrapper) {

                syncable.sync(wrapper,

                    function(remoteId, callback) {
                        callback(remoteObjects[keys[i]]);
                    },
                    settings.merge,
                    settings.upload,


                    function() {
                        processItem(i + 1);
                    });

            });


        };

        processItem(0);

    };

    syncable.syncRemoteArray = function(remoteObjects, callback) {

    };


    syncable.syncLocalChanges = function(
        callback
    ) {
        syncable.getItems(function(item) {
            return item.hasLocalChanges;
        }, function(changedItems) {
            var loopfn = function(i) {
                if (i >= changedItems.length) return callback();
                if (changedItems[i].unmergedRemoteVersion) return loopfn(i + 1);
                syncable.sync(changedItems[i],
                    function(remoteId, callback) {
                        callback(changedItems[i].remoteVersion);
                    },
                    settings.merge,
                    settings.upload, function() {
                        loopfn(i + 1);
                    });
            };
            loopfn(0);

        });
    };


    syncable.uncache = function(filter, callback) {
        var result = [];
        for (var li in localIndex) {
            var item = localIndex[li];
            if (!filter || filter(localIndex[li])) {
                delete localIndex[li];
                delete remoteIndex[item.remoteId];
                if (!settings.bulkSave) {
                    settings.removeFromDb(item);
                }
            }
        }
        if (settings.bulkSave) {
            settings.saveAllToDb(localIndex);
        }

        callback(result);
    };


    syncable.getItems = function(filter, callback) {
        var result = [];
        for (var li in localIndex) {
            if (!filter || filter(localIndex[li])) result.push(localIndex[li]);
        }
        callback(result);
    };



    return this;
};