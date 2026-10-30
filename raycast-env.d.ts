/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `play` command */
  export type Play = ExtensionPreferences & {}
  /** Preferences accessible in the `ticker` command */
  export type Ticker = ExtensionPreferences & {
  /** Notify When a Task Stops - Show a macOS notification when a task stops or a run finishes while you are away. */
  "notifications": boolean
}
}

declare namespace Arguments {
  /** Arguments passed to the `play` command */
  export type Play = {}
  /** Arguments passed to the `ticker` command */
  export type Ticker = {}
}

