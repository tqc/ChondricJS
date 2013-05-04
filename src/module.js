angular.module('chondric', [])
  .directive('ngTap', function() {

  return function(scope, element, attrs) {
    element.addClass('tappable');
    // eanble use of app global in angular expression if necessary
    if (attrs.ngTap && attrs.ngTap.indexOf("app.") == 0 && !scope.app) scope.app = app;
    var tapping;
    tapping = false;
    element.bind('touchstart mousedown', function(e) {
      element.addClass('active');
      element.removeClass('deactivated');
      tapping = true;
   //   e.preventDefault();
    //        e.stopPropagation();

//      return false;
    });
    element.bind('touchmove mousemove', function(e) {
      element.removeClass('active');
      element.addClass('deactivated');
if (tapping) {
      tapping = false;
    //  e.preventDefault();
    //  e.stopPropagation();
    //  return false;
    }

    });
    element.bind('touchend mouseup', function(e) {
      element.removeClass('active');
      if (tapping) {        
        scope.$apply(attrs['ngTap'], element);
      }
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

      element.bind('tap click', function(e) {
//   e.preventDefault();
//      e.stopPropagation();
  //    return false;

      });
  };
});