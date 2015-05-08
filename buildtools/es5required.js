$(document).ready(function() {
        var vp = $(".chondric-viewport");
        vp.addClass("viewport-error").removeClass("viewport-preload");

        var title = $("<h1>").appendTo(vp);
        var msg = $("<div>").addClass("message").appendTo(vp);
        var src = $("<div>").addClass("source").appendTo(vp);
        var detail = $("<div>").addClass("detail").appendTo(vp);

        title.text("[TITLE]");
        msg.text("[MESSAGE]");
        src.text("[SOURCE]");
        detail.text("[DETAIL]");
    });
    