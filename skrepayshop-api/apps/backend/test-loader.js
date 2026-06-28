const { MedusaAppLoader } = require("@medusajs/framework");
const { loadEnv, defineConfig } = require("@medusajs/framework/utils");
const { resolve } = require("path");

async function run() {
  loadEnv(process.env.NODE_ENV || 'development', process.cwd());
  const configModule = require(resolve(process.cwd(), "./.medusa/server/medusa-config.js"));
  
  // Create a container and register config
  const { createMedusaContainer } = require("@medusajs/utils");
  const container = createMedusaContainer();
  container.register("configModule", require("awilix").asValue(configModule));
  
  const loader = new MedusaAppLoader();
  // We don't have full container setup, but let's try
  try {
    const { modules } = await loader.load({
      registerInContainer: false,
      schemaOnly: true,
    });
    console.log("Loaded modules:");
    console.log(Object.keys(modules));
  } catch (e) {
    console.error(e);
  }
}
run().catch(console.error);
