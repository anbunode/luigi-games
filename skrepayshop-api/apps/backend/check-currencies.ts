import { MedusaApp } from "@medusajs/modules-sdk";
import { getConfigFile } from "@medusajs/utils";

async function run() {
  const { configModule } = await getConfigFile(process.cwd(), "medusa-config");
  
  const medusaApp = await MedusaApp({
    modulesConfig: configModule.modules,
    servicesConfig: configModule.projectConfig,
    injectedDependencies: {},
  });
  
  const currencyModule = medusaApp.modules.currency;
  if (!currencyModule) {
    console.log("Currency module not found");
    process.exit(1);
  }
  
  const currencies = await currencyModule.listCurrencies();
  console.log("Total currencies in DB:", currencies.length);
  if (currencies.length === 0) {
      console.log("No currencies found! The seed step was not run, or failed.");
  } else {
      console.log(currencies[0]);
  }
  process.exit(0);
}

run().catch(console.error);
