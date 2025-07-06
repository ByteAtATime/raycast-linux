import '@testing-library/jest-dom/vitest';
import { beforeAll } from 'vitest';

/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />

beforeAll(() => {
	// TODO: better method?
	global.ResizeObserver = class ResizeObserver {
		observe() {
			// do nothing
		}
		unobserve() {
			// do nothing
		}
		disconnect() {
			// do nothing
		}
	};
});
