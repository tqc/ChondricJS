@Directive({
    selector: "targetView",
})
class TargetView {
    constructor(scope, element, attrs, $compile) {
        var viewname = attrs.targetView;
        var sourceRoute = scope.pageRoute;
        console.log("Targeting view " + viewname + " from " + sourceRoute);
        var targetnode = $("[subview=" + viewname +"]");
        element.detach().appendTo(targetnode);
        scope.$parent.$on("$destroy", function() {
            element.remove();
        });
        scope.$watch("route", function(route) {
            if (route.indexOf(sourceRoute) == 0) element.addClass("active");
            else element.removeClass("active");
        });
    }
}

export default TargetView;