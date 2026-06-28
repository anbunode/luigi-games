const { MedusaAppLoader } = require("@medusajs/framework");
const { loadEnv } = require("@medusajs/framework/utils");
const { resolve } = require("path");

async function run() {
  loadEnv(process.env.NODE_ENV || 'development', process.cwd());
  const configModule = require(resolve(process.cwd(), "./.medusa/server/medusa-config.js"));
  
  const { createMedusaContainer } = require("@medusajs/utils");
  const container = createMedusaContainer();
  container.register("configModule", require("awilix").asValue(configModule));
  // also configManager
  const configManager = { loadConfig: () => configModule, config: configModule };
  container.register("configManager", require("awilix").asValue(configManager));
  
  const loader = new MedusaAppLoader();
  try {
    const { modules } = await loader.load({
      registerInContainer: false,
      schemaOnly: false,
    });
    console.log("Loaded modules:");
    console.log(Object.keys(modules));
  } catch (e) {
    console.error(e);
  }
}
run().catch(console.error);
