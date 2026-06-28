const { resolve } = require("path");
require("ts-node").register();
const servicePath = resolve(process.cwd(), "./src/modules/macro_region/service.ts");
const { default: MacroRegionModuleService } = require(servicePath);
console.log("has __joinerConfig?", !!MacroRegionModuleService.prototype.__joinerConfig);
if (MacroRegionModuleService.prototype.__joinerConfig) {
  console.log("joinerConfig:", MacroRegionModuleService.prototype.__joinerConfig());
}
