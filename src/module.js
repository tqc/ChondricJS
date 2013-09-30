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
   //   touching = false;
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
      if (touching || !clicking) return;
      touchend(e);
      clicking = false;
    });


      element.bind('tap click', function(e) {
      });
  };
})

.directive("previewcontrols", function() {

  return {
    restrict: "E",
    template: "<div id='previewcontrols'>"
    +"<button ng-tap='updatePreviewSettings(1024,768, true)'>iPad landscape</button>"
    +"<button ng-tap='updatePreviewSettings(768, 1024, true)'>iPad portrait</button>"
    +"<button ng-tap='updatePreviewSettings(568,320, true)'>iPhone5 landscape</button>"
    +"<button ng-tap='updatePreviewSettings(320, 568, true)'>iPhone5 portrait</button>"
    +"<button ng-tap='updatePreviewSettings(1024,748, false)'>iPad landscape iOS6</button>"
    +"<button ng-tap='updatePreviewSettings(768, 1004, false)'>iPad portrait iOS6</button>"
    +"<button ng-tap='updatePreviewSettings(568,300, false)'>iPhone5 landscape iOS6</button>"
    +"<button ng-tap='updatePreviewSettings(320,548, false)'>iPhone5 portrait iOS6</button>"
    +"<button ng-tap='reloadPreview()'>Reload</button>"

    +"</div>",
    link: function(scope, element, attrs) {
  scope.previewSettings = {
    width: 1024,
    height: 768,
    overlayStatusBar: true
  };
  scope.reloadPreview = function (){
    document.getElementById("preview").contentDocument.location.reload(true);
  }
  scope.updatePreviewSettings = function (w, h, overlayStatusBar){
  scope.previewSettings = {
    width: w,
    height: h,
    overlayStatusBar: overlayStatusBar
  };
    };
  }
}
});