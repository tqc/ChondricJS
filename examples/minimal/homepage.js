var app = app || {};
app.Views = app.Views || {};
app.ViewTemplates = app.ViewTemplates || {};


app.ViewTemplates.HomePageTemplate = function(options) {
    var settings = {
            template: "home.html"
    };
    $.extend(settings, options)
    Chondric.View.call(this, settings);
}
$.extend(app.ViewTemplates.HomePageTemplate.prototype, Chondric.View.prototype, 
{
    getDefaultModel: function() {
        return {};
    },
    updateModel: function(dataId, existingData, callback) {
        if (!this.model) this.model = this.getDefaultModel();
        var m = this.model;

     //   this.subViews["firstSubView"].setModel(m.subviewmodel);
        callback();
    },
    updateView: function() {
     //   this.subViews["firstSubView"].updateView();
    },
    attachSubviews: function() {
        var page = this;
     //   this.subViews["firstSubView"] = new Chondric.SampleSubviewTemplate({
     //       id: page.id+"_subview1",
     //       element: $(".subview", page.element)
     //   });

    }
});



app.Views.home = new app.ViewTemplates.HomePageTemplate({
	id: "home",
	next: "page2",
	prev: "page5"
});

/*

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
*/
