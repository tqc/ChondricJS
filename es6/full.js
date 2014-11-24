import * as core from './core'

export class App extends core.App {
	constructor(options) {
		super(options);

		this.registerSharedUiComponent(require("./sharedui/cjs-navigation-bar"));

	}
}