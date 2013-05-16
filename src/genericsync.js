Chondric.Syncable = function(options) {
	var syncable = this;

	var localIndex = {};
	var remoteIndex = {};

	var settings = syncable.settings = {
		saveToDb: function(wrapper) {}
	};

	$.extend(settings, options);


syncable.updateIndex = function(wrapper) {
	if (wrapper.remoteId) remoteIndex[wrapper.remoteId] = wrapper;
	if (wrapper.localId) localIndex[wrapper.localId] = wrapper;
}

// return wrapper object as it exists - local, remote or both may be unset.
// if a new wrapper is created it will be created with the known remote id.

syncable.getByRemoteId = function(id, callback) {
	if (remoteIndex[id]) {
	return callback(remoteIndex[id]);
	}
	else {
		var wrapper = {
			remoteId: id
		};
		return callback(wrapper);
	}
}

// local id should always be valid
syncable.getByLocalId = function(id, callback) {
	return callback(localIndex[id]);
}

syncable.addNew = function(localId, localVersion) {
	var wrapper = {
		localId: localId,
		localVersion: localVersion,
		hasLocalChanges: true
	}
	updateIndex(wrapper);
	return wrapper;
}

syncable.save = function(wrapper) {
	syncable.updateIndex(wrapper);
	settings.saveToDb(wrapper);
}

syncable.queueSave = function(wrapper) {
// todo: timer implementation
syncable.save(wrapper);
}

// ensure all are in the in memory list. 
// db is not independently accessible, so no need to load any that are already present
syncable.loadFromDbResults = function(wrappers) {
for (var i = 0; i < wrappers.length; i++) {
	var wrapper = wrappers[i]
	if (wrapper.remoteId && remoteIndex[wrapper.remoteId]) continue;
	if (wrapper.localId && localIndex[wrapper.localId]) continue;
	updateIndex(wrapper);
}
}


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
/*
		// new local item:
		{
			localId: 1,
			localVersion: { id:1},
			hasLocalChanges: true
		} 	
		// new remote item:
		{
			remoteId: 1,
			remoteVersion: { id:1}
		} 	
		// existing item:
		{
			remoteId: 1,
			remoteVersion: { id:1},
			localId: 1,
			localVersion: { id:1},
			hasLocalChanges: true
		} 	
*/
		wrapper.unmergedRemoteVersion = newRemoteVersion;

		mergeFunction(wrapper,  function() {
			// wrapper must now have local version set.
			// if merge changed anything, hasLocalChanges will be true
			updateIndex();
			if(wrapper.hasLocalChanges) {
				uploadfunction(wrapper, function() {
					// this may update remote id and unmergedRemoteVersion

					mergeFunction(wrapper, function() {
					updateIndex();
						// after second merge call, local must match remote
						wrapper.hasLocalChanges = false;
						syncable.queueSave(wrapper);
						callback();
					})
				})
			}
			else {
				wrapper.requiresSave = true;
				triggerSave(wrapper);
				callback();
			}
		})

	})
};

syncable.getItems = function(filter, callback) {
	var result = [];
	for (var li in localIndex) {
		if (!filter || filter(localIndex[li])) result.push(localIndex[li])
	}
	callback(result);
	};



	return this;
	};


var itemStore = new Chondric.Syncable({
saveToDb: function(wrapper) {}
}); 

// init
itemStore.loadFromDb(allwrappers, function() {
// ...	
});

// get list
		itemStore.getItems(function(wrapper) {
			return wrapper.localVersion.labels.indexOf("label1") >= 0;
		}, function(items) {
			//could use splice to update selecteditems in place
			updateView()
		});


// add new 

var wrapper = itemStore.addNew(localVersion)

// save

itemStore.save(item);


// sync with list of remote updates

var merge = function(wrapper, callback) {
			 	if (!wrapper.unmergedRemoteVersion) return callback();
			 	// merge here
			 	wrapper.remoteVersion = wrapper.unmergedRemoteVersion;
			 	delete wrapper.unmergedRemoteVersion;
			 	return callback();
			}

	getByRemoteId(remoteId, function(wrapper) {
		itemStore.sync(wrapper,
			 function(remoteId, callback) { callback(cachedRemoteVersion); }, 
			 merge,
			 function(wrapper, callback) {callback(newRemoteVersion);}
			function() {next();})
	});


// sync new items

	itemStore.getItems(function(wrapper) {
			return !wrapper.remoteId;
		}, function(wrappers) {

			// call sync on each wrapper

		});


var data = [
{
	// local object that may be changed by the ui
	localVersion: {}
	// set to true on local save
	hasLocalChanges: false,	
	remoteVersion: {},
	isDeleted: false,
}
]







// from custom sync job

function() {

	// got all remote items

	// in loop
	getByRemoteId(remoteId, function(wrapper) {
		sync(wrapper,
			 function(remoteId, callback) { callback(cachedRemoteVersion); }, 
			 function(wrapper, callback) { callback();},
			 function(wrapper, callback) {callback();}
			function() {next();})
	});

}




// get filtered list 

function() {

	loadFromDb(allwrappers, function() {
		getItems(function(wrapper) {
			return wrapper.localVersion.labels.indexOf("label1") >= 0;
		}, function(items) {updateView()});

	}) 


}