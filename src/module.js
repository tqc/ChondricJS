angular.module('chondric', [])
  .directive('ngTap', function() {

  return function(scope, element, attrs) {
    element.addClass('tappable');
    // eanble use of app global in angular expression if necessary
    if (attrs.ngTap && attrs.ngTap.indexOf("app.") == 0 && !scope.app) scope.app = app;
    var tapping = false;
    var touching = false;
    var clicking = false;


    var touchstart = function(e) {
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
      clicking = false;      
      touching = false;
      tapping = false;
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    element.bind('mousedown', function(e) {
      if (touching) return;
      clicking = true;
      touchstart(e);
    });

    element.bind('touchstart', function(e) {
      touching = true;
      touchstart(e)
    });

    element.bind('touchmove mousemove', touchmove);

    element.bind('touchend', touchend);

    element.bind('mouseup',  function(e) {
      if (!clicking) return;
      touchend(e);
      clicking = false;
    });


      element.bind('tap click', function(e) {
      });
  };
});