const { resolve } = require("path");
const configModule = require(resolve(process.cwd(), "./.medusa/server/medusa-config.js"));
console.log("Config modules:", configModule.modules);
