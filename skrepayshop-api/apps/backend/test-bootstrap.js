const { resolve } = require("path");
require("ts-node").register();
const configModule = require(resolve(process.cwd(), "./.medusa/server/medusa-config.js"));
const { MedusaModule } = require("@medusajs/modules-sdk");

async function run() {
  const modulesToLoad = [];
  for (const moduleName of Object.keys(configModule.modules)) {
    const mod = configModule.modules[moduleName];
    if (moduleName !== "macro_region") continue;
    
    modulesToLoad.push({
      moduleKey: moduleName,
      defaultPath: mod.resolve,
      declaration: { resolve: mod.resolve, options: {} },
      sharedContainer: require("@medusajs/utils").createMedusaContainer(),
      moduleDefinition: { key: moduleName, isQueryable: false, ...mod.definition },
    });
  }
  
  try {
    const loaded = await MedusaModule.bootstrapAll(modulesToLoad, {
      schemaOnly: true,
      cwd: process.cwd(),
    });
    console.log("joinerConfig property:", loaded[0].macro_region.__joinerConfig);
  } catch(e) {
    console.error("Bootstrap error:", e);
  }
}
run().catch(console.error);
