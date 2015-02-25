import * as core from './core';

export class App extends core.App {
	constructor(options) {
		super(options);

		this.registerSharedUiComponent(require("./sharedui/cjs-action-sheet"));
		this.registerSharedUiComponent(require("./sharedui/cjs-left-panel"));
		this.registerSharedUiComponent(require("./sharedui/cjs-navigation-bar"));
		this.registerSharedUiComponent(require("./sharedui/cjs-right-panel"));
		this.registerSharedUiComponent(require("./sharedui/cjs-shared-popup"));
		this.registerSharedUiComponent(require("./sharedui/cjs-tab-footer"));

	}
}