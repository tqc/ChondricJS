angular.module('chondric').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('cjs-action-sheet.html',
    "<div cjs-popover=\"componentDefinition.popuptrigger\">\n" +
    "    <div class=\"poparrow\"></div>\n" +
    "    <button ng-repeat=\"b in componentDefinition.data.items\" ng-tap=\"handleSharedPopupButtonClick(b)\">{{b.title}}</button>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-left-panel.html',
    "<div cjs-sidepanel=\"componentDefinition.popuptrigger\">\n" +
    "<div ng-include=\"componentDefinition.data.templateUrl\"></div>\n" +
    "</div>"
  );


  $templateCache.put('cjs-loading-overlay-compact.html',
    "<div class=\"cjs-loading-overlay cjs-loading-overlay-compact\">\n" +
    "    <div ng-show=\"!error\" class=\"progress small\">\n" +
    "        <div></div>\n" +
    "    </div>\n" +
    "    <div class=\"message\" ng-show=\"!error\">{{message || \"Loading\"}}</div>\n" +
    "    <div class=\"error\" ng-show=\"error\">{{error}}</div>\n" +
    "    <div class=\"buttons\">\n" +
    "        <button ng-show=\"retry && error\" ng-tap=\"retry()\">Retry</button>\n" +
    "        <button ng-show=\"cancel\" ng-tap=\"cancel()\">Cancel</button>\n" +
    "    </div>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-loading-overlay.html',
    "<div class=\"cjs-loading-overlay cjs-loading-overlay-full\">\n" +
    "    <div ng-show=\"!error\" class=\"progress large\">\n" +
    "        <div></div>\n" +
    "    </div>\n" +
    "    <div class=\"title\" ng-show=\"title && !error\">{{title}}</div>\n" +
    "     <div class=\"message\" ng-show=\"!error\">{{message || \"Loading\"}}</div>\n" +
    "   <div class=\"error\" ng-show=\"error\">{{error}}</div>\n" +
    "    <div class=\"buttons\">\n" +
    "        <button ng-show=\"retry && error\" ng-tap=\"retry()\">Retry</button>\n" +
    "        <button ng-show=\"cancel\" ng-tap=\"cancel()\">Cancel</button>\n" +
    "    </div>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-navigation-bar.html',
    "<div class=\"navbar\" ng-style=\"{top: (-60 + (((globalHeaderOptions.v1.active && 60 || 0) * (1 - globalHeaderOptions.transitionState)) + ((globalHeaderOptions.v2.active && 60 || 0) * (globalHeaderOptions.transitionState))))+'px' }\">\n" +
    "    <div class=\"v1\" ng-style=\"{opacity:(1-globalHeaderOptions.transitionState), 'z-index': ((globalHeaderOptions.transitionState > 0.5) ? 1: 2)  }\">\n" +
    "        <button class=\"left\" ng-repeat=\"b in globalHeaderOptions.v1.data.leftButtons\" ng-tap=\"handleSharedHeaderButtonClick(globalHeaderOptions.v1, b, lastTap)\">{{b.title}}</button>\n" +
    "        <h1 ng-show=\"!globalHeaderOptions.v1.data.titleEditable\">{{globalHeaderOptions.v1.data.title}}</h1>\n" +
    "        <input class=\"h1\" ng-show=\"globalHeaderOptions.v1.data.titleEditable\" type=\"text\" ng-model=\"globalHeaderOptions.v1.data.title\" ng-change=\"titleChanged()\" />\n" +
    "        <button class=\"right\" ng-repeat=\"b in globalHeaderOptions.v1.data.rightButtons\" ng-tap=\"handleSharedHeaderButtonClick(globalHeaderOptions.v1, b, lastTap)\">{{b.title}}</button>\n" +
    "    </div>\n" +
    "    <div class=\"v2\" ng-style=\"{opacity:(globalHeaderOptions.transitionState), 'z-index': ((globalHeaderOptions.transitionState > 0.5) ? 2: 1)}\">\n" +
    "        <button class=\"left\" ng-repeat=\"b in globalHeaderOptions.v2.data.leftButtons\" ng-tap=\"handleSharedHeaderButtonClick(globalHeaderOptions.v2, b, lastTap)\">{{b.title}}</button>\n" +
    "        <h1 ng-show=\"!globalHeaderOptions.v2.data.titleEditable\">{{globalHeaderOptions.v2.data.title}}</h1>\n" +
    "        <input class=\"h1\" ng-show=\"globalHeaderOptions.v2.data.titleEditable\" type=\"text\" ng-model=\"globalHeaderOptions.v2.data.title\" ng-change=\"titleChanged()\" />\n" +
    "        <button class=\"right\" ng-repeat=\"b in globalHeaderOptions.v2.data.rightButtons\" ng-tap=\"handleSharedHeaderButtonClick(globalHeaderOptions.v2, b, lastTap)\">{{b.title}}</button>\n" +
    "    </div>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-preview-controls.html',
    "<div id='previewcontrols'>\n" +
    "    <button ng-tap='updatePreviewSettings(1024,768, true)'>iPad landscape</button>\n" +
    "    <button ng-tap='updatePreviewSettings(768, 1024, true)'>iPad portrait</button>\n" +
    "    <button ng-tap='updatePreviewSettings(568,320, true)'>iPhone5 landscape</button>\n" +
    "    <button ng-tap='updatePreviewSettings(320, 568, true)'>iPhone5 portrait</button>\n" +
    "    <button ng-tap='updatePreviewSettings(1024,748, false)'>iPad landscape iOS6</button>\n" +
    "    <button ng-tap='updatePreviewSettings(768, 1004, false)'>iPad portrait iOS6</button>\n" +
    "    <button ng-tap='updatePreviewSettings(568,300, false)'>iPhone5 landscape iOS6</button>\n" +
    "    <button ng-tap='updatePreviewSettings(320,548, false)'>iPhone5 portrait iOS6</button>\n" +
    "    <button ng-tap='reloadPreview()'>Reload</button>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-right-panel.html',
    "<div cjs-sidepanel=\"componentDefinition.popuptrigger\">\n" +
    "<div ng-include=\"componentDefinition.data.templateUrl\"></div>\n" +
    "</div>"
  );


  $templateCache.put('cjs-shared-popup.html',
    "<div cjs-popup=\"componentDefinition.popuptrigger\">\n" +
    "<div ng-include=\"componentDefinition.data.templateUrl\"></div>\n" +
    "</div>"
  );

}]);
