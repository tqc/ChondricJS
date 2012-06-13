var app = new Chondric.App({
	name : "Minimal Example App",
	mightBePhoneGap: false,
	scriptGroups : [],
	contexts : {
		"item" : {
			childContexts : [],
			getValueFromString : function(s) {
				return s;
			}
		}
	},
	getDatabase : function() {
		return new ExampleDb();
	},
	loadData : function(loadedctx, callback) {	
		console.log("loading data");


		
		app.db.getItems( function(items) {
			
			console.log("items loaded");
			app.items = items;
		app.context.item(loadedctx.item);

										callback();
		});
	
	},
	customInit : function(callback) {
		callback()
	},
	enableScroll : true
})

app.items = {};

app.init();

