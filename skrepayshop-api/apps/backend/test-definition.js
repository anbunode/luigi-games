const { resolve } = require("path");
require("ts-node").register();
const configModule = require(resolve(process.cwd(), "./.medusa/server/medusa-config.js"));

console.log("Definition:", configModule.modules.macro_region.definition);
