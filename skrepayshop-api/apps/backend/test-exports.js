const { default: MacroRegionModule } = require("./.medusa/server/src/modules/macro_region/index.js");
console.log("MacroRegionModule exports:", Object.keys(MacroRegionModule));
console.log("module string:", MacroRegionModule.module);
