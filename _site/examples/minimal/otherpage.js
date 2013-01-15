

app.ViewTemplates.OtherPageTemplate = function(options) {
    var settings = {
            template: "other.html"
    };
    $.extend(settings, options)
    Chondric.View.call(this, settings);
}
$.extend(app.ViewTemplates.OtherPageTemplate.prototype, Chondric.View.prototype, 
{
    getDefaultModel: function() {
        return {};
    },
    updateModel: function(dataId, callback) {
        if (!this.model) this.model = this.getDefaultModel();
        var m = this.model;

        this.subViews["firstSubView"].setModel(m.subviewmodel);
        callback();
    },
    updateView: function() {
        this.subViews["firstSubView"].updateView();
    },
    attachSubviews: function() {
        var page = this;
        this.subViews["firstSubView"] = new Chondric.SampleSubviewTemplate({
            id: page.id+"_subview1",
            element: $(".subview", page.element)
        });

    }
});



app.Views.other = new app.ViewTemplates.OtherPageTemplate({
    id: "other"
});

