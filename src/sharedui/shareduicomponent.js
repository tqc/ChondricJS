export class SharedUiComponent {
    constructor() {
        console.log("Base shared component constructor");
        var component = this;
        component.ctrl = ["$scope", function($scope) {
            component.controller($scope);
        }];

    }
    setState() {
        console.log("Base shared component set state");
    }
    controller() {
        console.log("Base shared component controller");
    }
}