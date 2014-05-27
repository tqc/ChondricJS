app.createViewTemplate({
    templateId: "__PAGEID__",
    __TEMPLATEFOLDER__
    route: "__PAGEROUTE__",
    controller: function($scope) {
        $scope.runTests = function() {
            window.should = chai.should();
            window.assert = chai.assert;
            window.expect = chai.expect;

            $("#mocha").html("");
            mocha.checkLeaks();
            mocha.globals(['jQuery']);
            mocha.run();
        };
    },
    controllers: {}
});