import type { Keyboard } from "@raycast/api";

type ShortcutParts = {
  modifiers: Keyboard.KeyModifier[];
  key: Keyboard.KeyEquivalent;
};

function formatShortcutParts(parts: ShortcutParts, isMac: boolean): string {
  const modifierMap = {
    mac: {
      cmd: "⌘",
      ctrl: "⌃",
      opt: "⌥",
      shift: "⇧",
    },
    other: {
      cmd: "Win",
      ctrl: "Ctrl",
      opt: "Alt",
      shift: "Shift",
    },
  };

  const keyMap: Partial<Record<Keyboard.KeyEquivalent, string>> = {
    return: "⏎",
    enter: "⏎",
    delete: "⌫",
    backspace: "⌫",
    deleteForward: "⌦",
    arrowUp: "↑",
    arrowDown: "↓",
    arrowLeft: "←",
    arrowRight: "→",
    tab: "⇥",
    escape: "⎋",
    space: "␣",
  };

  const currentModifiers = isMac ? modifierMap.mac : modifierMap.other;

  const modifierStrings = parts.modifiers.map((mod) => currentModifiers[mod]);

  const keyString = keyMap[parts.key] ?? parts.key.toUpperCase();

  const allParts = [...modifierStrings, keyString];

  return allParts.join(" + ");
}

export function shortcutToText(
  shortcut: Keyboard.Shortcut,
  forceOS?: "macOS" | "windows"
): string {
  const isMac = forceOS
    ? forceOS === "macOS"
    : typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  if ("modifiers" in shortcut) {
    return formatShortcutParts(shortcut, isMac);
  } else {
    if (isMac) {
      return formatShortcutParts(shortcut.macOS, true);
    } else {
      return formatShortcutParts(shortcut.windows, false);
    }
  }
}
