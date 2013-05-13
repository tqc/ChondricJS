angular.module('chondric', [])
  .directive('ngTap', function() {

  return function(scope, element, attrs) {
    element.addClass('tappable');
    // eanble use of app global in angular expression if necessary
    if (attrs.ngTap && attrs.ngTap.indexOf("app.") == 0 && !scope.app) scope.app = app;
    var tapping;
    tapping = false;
    touching = false;

    var touchstart = function(e) {
      touching = true;
      element.addClass('active');
      element.removeClass('deactivated');
      tapping = true;
    };

    var touchmove = function(e) {
      element.removeClass('active');
      element.addClass('deactivated');
      if (tapping) {
        tapping = false;
      }
      };

var touchend = function(e) {


      element.removeClass('active');
      if (tapping) {    
        tapping = false;    
        scope.$apply(attrs['ngTap'], element);
      }
      touching = false;
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    element.bind('mousedown', function(e) {
      if (touching) return;
      touchstart(e);
    });

    element.bind('touchstart', function(e) {
      touching = true;
      touchstart(e)
    });

    element.bind('touchmove mousemove', touchmove);

    element.bind('touchend', touchend);

    element.bind('mouseup',  function(e) {
      if (touching) return;
      touchend(e);
    });


      element.bind('tap click', function(e) {
      });
  };
});