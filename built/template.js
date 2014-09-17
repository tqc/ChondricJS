angular.module('chondric').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('cjs-action-sheet.html',
    "<div cjs-popover=\"componentDefinition.popuptrigger\">\n" +
    "    <div class=\"poparrow\"></div>\n" +
    "    <button ng-repeat=\"b in componentDefinition.data.items\" ng-tap=\"handleSharedPopupButtonClick(b)\">{{b.title}}</button>\n" +
    "</div>\n"
  );


  $templateCache.put('cjs-left-panel.html',
    "<div cjs-sidepanel=\"componentDefinition.popuptrigger\" ng-class=\"{active: componentDefinition.active}\">\n" +
    "<div ng-if=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\" ng-include=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\"></div>\n" +
    "<div ng-if=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" cjs-json-template=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" data=\"componentDefinition.data\"></div>\n" +
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


  $templateCache.put('cjs-loading-overlay-simple.html',
    "<div class=\"cjs-loading-overlay cjs-loading-overlay-simple\">\n" +
    "    <div ng-show=\"!error\" class=\"progress small\">\n" +
    "        <div></div>\n" +
    "    </div>\n" +
    "    <div class=\"error\" ng-show=\"error\">{{error}}</div>\n" +
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
    "<div class=\"navbar\" ng-repeat=\"state in componentDefinition.states track by $index\" ng-style-prefixer=\"{zIndex:(state.isActivating? 1200 : 1100), 'top': (state.translateY)+'px', opacity: state.opacity, 'transition': 'opacity 0.3s ease, top 0.3s ease'}\">\n" +
    "     <button class=\"left icon-left icon-custom\" ng-repeat=\"b in state.data.leftButtons\" ng-tap=\"handleSharedHeaderButtonClick(state, b, lastTap)\" ng-class=\"{'icon-only': (b.icon ? true: false)}\"><div ng-if=\"b.icon\" class=\"maskedicon\" ng-style=\"{'-webkit-mask-image': 'url('+b.icon+')'}\"></div> {{b.title}}</button>\n" +
    "        <h1 ng-show=\"!state.data.titleEditable\">{{state.data.title}}</h1>\n" +
    "        <input class=\"h1\" ng-show=\"state.data.titleEditable\" type=\"text\" ng-model=\"state.data.title\" ng-change=\"titleChanged(state)\" />\n" +
    "        <button class=\"right icon-right icon-custom\" ng-repeat=\"b in state.data.rightButtons\" ng-tap=\"handleSharedHeaderButtonClick(state, b, lastTap)\" ng-class=\"{'icon-only': (b.icon ? true: false)}\"><div ng-if=\"b.icon\" class=\"maskedicon\" ng-style=\"{'-webkit-mask-image': 'url('+b.icon+')'}\"></div> {{b.title}}</button>\n" +
    "\n" +
    "</div>"
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
    "<div cjs-sidepanel=\"componentDefinition.popuptrigger\" ng-class=\"{active: componentDefinition.active}\">\n" +
    "<div ng-if=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\" ng-include=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\"></div>\n" +
    "<div ng-if=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" cjs-json-template=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" data=\"componentDefinition.data\"></div>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('cjs-shared-popup.html',
    "<div cjs-popup=\"componentDefinition.popuptrigger\" ng-class=\"{nativetransition: componentDefinition.nativeTransition}\" class=\"{{componentDefinition.data.additionalClasses}}\">\n" +
    "<div ng-if=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\" ng-include=\"componentDefinition.data.templateUrl || componentDefinition.contentTemplateUrl\"></div>\n" +
    "<div ng-if=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" cjs-json-template=\"componentDefinition.data.jsonTemplate || componentDefinition.contentJsonTemplate\" data=\"componentDefinition.data\"></div>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('cjs-tab-footer.html',
    "<div class=\"tabbar\" ng-show=\"componentDefinition.active\">\n" +
    "\n" +
    "    <button ng-repeat=\"tab in componentDefinition.data.buttons track by tab.value\"  ng-tap=\"setTab(tab.value)\" ng-class=\"{selected: tab.value == componentDefinition.selectedTab}\" class=\"icon-top icon-custom\"><div class=\"maskedicon\" ng-style=\"{'-webkit-mask-image': 'url('+tab.icon+')'}\"></div> {{tab.title}}</button>\n" +
    "\n" +
    "    \n" +
    "</div>"
  );

}]);
