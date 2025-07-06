class FocusManager {
	#stack = $state<string[]>(['main-input']);

	get activeScope(): string | undefined {
		return this.#stack.at(-1);
	}

	requestFocus(scopeId: string) {
		if (this.activeScope !== scopeId) {
			this.#stack.push(scopeId);
			this.#stack = [...this.#stack];
		}
	}

	releaseFocus(scopeId: string) {
		if (this.activeScope === scopeId) {
			this.#stack.pop();
			this.#stack = [...this.#stack];
		} else {
			// If not active, remove it from wherever it is.
			// This handles cases where a scope is closed out of order.
			const index = this.#stack.lastIndexOf(scopeId);
			if (index > -1) {
				this.#stack.splice(index, 1);
				this.#stack = [...this.#stack];
			}
		}
	}

	reset() {
		this.#stack = ['main-input'];
	}
}

export const focusManager = new FocusManager();
