app.createViewTemplate(
    Chondric.View,
    "OtherPageTemplate",
    "other.html",
    {
    getDefaultModel: function() {
        return {};
    },
    updateModel: function(dataId, existingData, callback) {
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
}
   );



app.Views.other = new app.ViewTemplates.OtherPageTemplate({
    id: "other"
});

