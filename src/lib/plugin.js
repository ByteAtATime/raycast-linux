'use strict';
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
	for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
	if ((from && typeof from === 'object') || typeof from === 'function') {
		for (let key of __getOwnPropNames(from))
			if (!__hasOwnProp.call(to, key) && key !== except)
				__defProp(to, key, {
					get: () => from[key],
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
	}
	return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
	default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_api = require('@raycast/api');
var command = async () => {
	const now = new Date();
	const london = now.toLocaleString(void 0, {
		timeZone: 'Europe/London',
		timeStyle: 'short'
	});
	const berlin = now.toLocaleString(void 0, {
		timeZone: 'Europe/Berlin',
		timeStyle: 'short'
	});
	const moscow = now.toLocaleString(void 0, {
		timeZone: 'Europe/Moscow',
		timeStyle: 'short'
	});
	const india = now.toLocaleString(void 0, {
		timeZone: 'Asia/Kolkata',
		timeStyle: 'short'
	});
	const subtitle = `\u{1F1EC}\u{1F1E7} ${london}   \u{1F1F3}\u{1F1F1}\u{1F1E9}\u{1F1EA}\u{1F1F3}\u{1F1F4}\u{1F1E9}\u{1F1F0}\u{1F1F5}\u{1F1F1} ${berlin}   \u{1F1F7}\u{1F1FA} ${moscow}   \u{1F1EE}\u{1F1F3} ${india}`;
	await (0, import_api.updateCommandMetadata)({ subtitle });
	if (import_api.environment.launchType === import_api.LaunchType.UserInitiated) {
		const toast = new import_api.Toast({
			style: import_api.Toast.Style.Success,
			title: 'Refreshed!',
			message: subtitle
		});
		toast.primaryAction = {
			title: 'Copy to Clipboard',
			shortcut: { modifiers: ['cmd', 'shift'], key: 'c' },
			onAction: () => import_api.Clipboard.copy(subtitle)
		};
		await toast.show();
	}
};
var src_default = command;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBDbGlwYm9hcmQsIGVudmlyb25tZW50LCBMYXVuY2hUeXBlLCBUb2FzdCwgdXBkYXRlQ29tbWFuZE1ldGFkYXRhIH0gZnJvbSBcIkByYXljYXN0L2FwaVwiO1xuXG5jb25zdCBjb21tYW5kID0gYXN5bmMgKCkgPT4ge1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuXG4gIGNvbnN0IGxvbmRvbiA9IG5vdy50b0xvY2FsZVN0cmluZyh1bmRlZmluZWQsIHsgdGltZVpvbmU6IFwiRXVyb3BlL0xvbmRvblwiLCB0aW1lU3R5bGU6IFwic2hvcnRcIiB9KTtcbiAgY29uc3QgYmVybGluID0gbm93LnRvTG9jYWxlU3RyaW5nKHVuZGVmaW5lZCwgeyB0aW1lWm9uZTogXCJFdXJvcGUvQmVybGluXCIsIHRpbWVTdHlsZTogXCJzaG9ydFwiIH0pO1xuICBjb25zdCBtb3Njb3cgPSBub3cudG9Mb2NhbGVTdHJpbmcodW5kZWZpbmVkLCB7IHRpbWVab25lOiBcIkV1cm9wZS9Nb3Njb3dcIiwgdGltZVN0eWxlOiBcInNob3J0XCIgfSk7XG4gIGNvbnN0IGluZGlhID0gbm93LnRvTG9jYWxlU3RyaW5nKHVuZGVmaW5lZCwgeyB0aW1lWm9uZTogXCJBc2lhL0tvbGthdGFcIiwgdGltZVN0eWxlOiBcInNob3J0XCIgfSk7XG5cbiAgY29uc3Qgc3VidGl0bGUgPSBgXHVEODNDXHVEREVDXHVEODNDXHVEREU3ICR7bG9uZG9ufSAgIFx1RDgzQ1x1RERGM1x1RDgzQ1x1RERGMVx1RDgzQ1x1RERFOVx1RDgzQ1x1RERFQVx1RDgzQ1x1RERGM1x1RDgzQ1x1RERGNFx1RDgzQ1x1RERFOVx1RDgzQ1x1RERGMFx1RDgzQ1x1RERGNVx1RDgzQ1x1RERGMSAke2Jlcmxpbn0gICBcdUQ4M0NcdURERjdcdUQ4M0NcdURERkEgJHttb3Njb3d9ICAgXHVEODNDXHVEREVFXHVEODNDXHVEREYzICR7aW5kaWF9YDtcbiAgYXdhaXQgdXBkYXRlQ29tbWFuZE1ldGFkYXRhKHsgc3VidGl0bGUgfSk7XG5cbiAgaWYgKGVudmlyb25tZW50LmxhdW5jaFR5cGUgPT09IExhdW5jaFR5cGUuVXNlckluaXRpYXRlZCkge1xuICAgIGNvbnN0IHRvYXN0ID0gbmV3IFRvYXN0KHtcbiAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5TdWNjZXNzLFxuICAgICAgdGl0bGU6IFwiUmVmcmVzaGVkIVwiLFxuICAgICAgbWVzc2FnZTogc3VidGl0bGUsXG4gICAgfSk7XG4gICAgdG9hc3QucHJpbWFyeUFjdGlvbiA9IHtcbiAgICAgIHRpdGxlOiBcIkNvcHkgdG8gQ2xpcGJvYXJkXCIsXG4gICAgICBzaG9ydGN1dDogeyBtb2RpZmllcnM6IFtcImNtZFwiLCBcInNoaWZ0XCJdLCBrZXk6IFwiY1wiIH0sXG4gICAgICBvbkFjdGlvbjogKCkgPT4gQ2xpcGJvYXJkLmNvcHkoc3VidGl0bGUpLFxuICAgIH07XG4gICAgYXdhaXQgdG9hc3Quc2hvdygpO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb21tYW5kO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQWlGO0FBRWpGLElBQU0sVUFBVSxZQUFZO0FBQzFCLFFBQU0sTUFBTSxJQUFJLEtBQUs7QUFFckIsUUFBTSxTQUFTLElBQUksZUFBZSxRQUFXLEVBQUUsVUFBVSxpQkFBaUIsV0FBVyxRQUFRLENBQUM7QUFDOUYsUUFBTSxTQUFTLElBQUksZUFBZSxRQUFXLEVBQUUsVUFBVSxpQkFBaUIsV0FBVyxRQUFRLENBQUM7QUFDOUYsUUFBTSxTQUFTLElBQUksZUFBZSxRQUFXLEVBQUUsVUFBVSxpQkFBaUIsV0FBVyxRQUFRLENBQUM7QUFDOUYsUUFBTSxRQUFRLElBQUksZUFBZSxRQUFXLEVBQUUsVUFBVSxnQkFBZ0IsV0FBVyxRQUFRLENBQUM7QUFFNUYsUUFBTSxXQUFXLHNCQUFRLHVHQUFpQywrQkFBaUIsK0JBQWlCO0FBQzVGLFlBQU0sa0NBQXNCLEVBQUUsU0FBUyxDQUFDO0FBRXhDLE1BQUksdUJBQVksZUFBZSxzQkFBVyxlQUFlO0FBQ3ZELFVBQU0sUUFBUSxJQUFJLGlCQUFNO0FBQUEsTUFDdEIsT0FBTyxpQkFBTSxNQUFNO0FBQUEsTUFDbkIsT0FBTztBQUFBLE1BQ1AsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUNELFVBQU0sZ0JBQWdCO0FBQUEsTUFDcEIsT0FBTztBQUFBLE1BQ1AsVUFBVSxFQUFFLFdBQVcsQ0FBQyxPQUFPLE9BQU8sR0FBRyxLQUFLLElBQUk7QUFBQSxNQUNsRCxVQUFVLE1BQU0scUJBQVUsS0FBSyxRQUFRO0FBQUEsSUFDekM7QUFDQSxVQUFNLE1BQU0sS0FBSztBQUFBLEVBQ25CO0FBQ0Y7QUFFQSxJQUFPLGNBQVE7IiwKICAibmFtZXMiOiBbXQp9Cg==
