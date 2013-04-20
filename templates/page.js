app.createViewTemplate(
    {
    templateId: "__PAGEID__",
    getDefaultModel: function() {
        return {};
    },
    updateModel: function(dataId, existingData, callback) {
        if (!this.model) this.model = this.getDefaultModel();
        var m = this.model;

        this.prev = "__PREVPAGEID__";
        this.next = "__NEXTPAGEID__";

        callback();
    },
    attachEvents: function() {

    },
    updateView: function() {

    },

}
   );
