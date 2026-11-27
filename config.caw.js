import {
  ADDON_CATEGORY,
  ADDON_TYPE,
  PLUGIN_TYPE,
  PROPERTY_TYPE,
} from "./template/enums.js";
import _version from "./version.js";
export const addonType = ADDON_TYPE.BEHAVIOR;
export const type = PLUGIN_TYPE.OBJECT;
export const id = "salmanshh_simple_health";
export const name = "Simple Health";
export const version = _version;
export const minConstructVersion = undefined;
export const author = "SalmanShh";
export const website = "https://www.construct.net";
export const documentation = "https://www.construct.net";
export const description = "A complete health management behavior for Construct 3 with damage, healing, and death detection.";
export const category = ADDON_CATEGORY.ATTRIBUTES;

export const hasDomside = false;
export const files = {
  extensionScript: {
    enabled: false, // set to false to disable the extension script
    watch: true, // set to true to enable live reload on changes during development
    targets: ["x86", "x64"],
    // you don't need to change this, the build step will rename the dll for you. Only change this if you change the name of the dll exported by Visual Studio
    name: "MyExtension",
  },
  fileDependencies: [],
  remoteFileDependencies: [
    // {
    //   src: "https://example.com/api.js", // Must use https:// or same-protocol // URLs. http:// is not allowed.
    //   type: "" // Optional: "" or "module". Empty string or omit for classic script.
    // }
  ],
  cordovaPluginReferences: [],
  cordovaResourceFiles: [],
};

// categories that are not filled will use the folder name
// Display names only — the folder name stays the category ID so existing projects are unaffected
export const aceCategories = {
  "Temporary Health": "Health Pools",
};

export const info = {
  // icon: "icon.svg",
  // PLUGIN world only
  // defaultImageUrl: "default-image.png",
  Set: {
    // COMMON to all
    CanBeBundled: true,
    IsDeprecated: false,
    GooglePlayServicesEnabled: false,

    // BEHAVIOR only
    IsOnlyOneAllowed: false,

    // PLUGIN world only
    IsResizable: false,
    IsRotatable: false,
    Is3D: false,
    HasImage: false,
    IsTiled: false,
    SupportsZElevation: false,
    SupportsColor: false,
    SupportsEffects: false,
    MustPreDraw: false,

    // PLUGIN object only
    IsSingleGlobal: true,
  },
  // PLUGIN only
  AddCommonACEs: {
    Position: false,
    SceneGraph: false,
    Size: false,
    Angle: false,
    Appearance: false,
    ZOrder: false,
  },
};

// Construct saves property values by id, so order only matters to the runtime,
// which looks each value up by id (see PROP in src/runtime/instance.js).
export const properties = [
  {
    type: PROPERTY_TYPE.CHECK,
    id: "debugMode",
    name: "Debug Mode",
    desc: "Write health events, and actions that were ignored, to the browser console to help find mistakes in events. Turn off for release.",
    options: {
      initialValue: false,
    },
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "maxHealth",
    name: "Max Health",
    desc: "Initial maximum health for instances with this behavior.",
    options: {
      initialValue: 100,
    },
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "invulnerable",
    name: "Invulnerable",
    desc: "Start instances invulnerable to damage.",
    options: {
      initialValue: false,
    },
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "destroyOnDeath",
    name: "Destroy on Death",
    desc: "Destroy the instance when it dies.",
    options: {
      initialValue: false,
    },
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "clearStatusesOnDeath",
    name: "Clear Statuses on Death",
    desc: "Remove all active statuses when the instance dies.",
    options: {
      initialValue: true,
    },
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "enabled",
    name: "Enabled",
    desc: "When disabled, damage, healing and new statuses are ignored, and pool decay and status timers pause.",
    options: {
      initialValue: true,
    },
  },
];
