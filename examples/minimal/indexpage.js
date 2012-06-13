app.Pages.indexPage = new Chondric.Page({
	getViewModel : function(callback) {
		var page = this;
		var m = {
		};
		if(this.model)
			m = this.model;
		this.model = m;

		m.items = app.items;

	 		callback(m);
		
	},
	directionalNavigation : [],

	customEvents : function(pagediv) {
		// attach events for the pages subviews using live - this runs on page create, so in updateview
		// we only need to update the dom elements / attributes
		var page = this;

		$("#btnNewItem", pagediv).live("vclick", function() {
			return false;
		});

	},
	variations : {
		modelError : {
			condition : function(m) {
				return m.error;
			},
			update : function(page, varDiv, m) {
			},
			attach : function(page, varDiv) {
			}
		},
		noItemsExist : {
			condition : function(m) {
				if (!m.items) return true;
				for (var item in m.items) {
					return false;
					}
				return true;
			},
			update : function(page, varDiv, m) {
			},
			attach : function(page, varDiv) {
			}
		},
		itemList : {
			update : function(page, varDiv, m) {
			},
			attach : function(page, varDiv) {
			}
		}
	},

	customViewUpdate : function(pagediv, m) {
		var page = this;
		if(page.updating)
			return;
		page.updating = true;





		page.updating = false;
	}
})

