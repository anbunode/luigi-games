const { default: MacroRegionModule } = require("./.medusa/server/src/modules/macro_region/index.js");
console.log("Linkable properties:", Object.keys(MacroRegionModule.linkable));
console.log("macroRegion config:", MacroRegionModule.linkable.macroRegion);
