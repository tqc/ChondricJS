/* jshint browser: true */
/* global $: false */

$(document).ready(function() {
    var vp = $(".chondric-viewport,[chondric-viewport]");
    vp.addClass("viewport-error").removeClass("viewport-preload");

    var title = "[TITLE]";
    if (title) $("<h1>").appendTo(vp).html(title);

    var msg = "[MESSAGE]";
    if (msg) $("<div>").addClass("message").appendTo(vp).html(msg);
    var src = "[SOURCE]";
    if (src) $("<div>").addClass("source").appendTo(vp).html(src);
    var detail = "[DETAIL]";
    if (detail) $("<div>").addClass("detail").appendTo(vp).html(detail);

});
