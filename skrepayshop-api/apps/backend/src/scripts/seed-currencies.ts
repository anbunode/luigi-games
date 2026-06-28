import { MedusaContainer } from "@medusajs/types";
import { defaultCurrencies, ContainerRegistrationKeys } from "@medusajs/utils";

export default async function seedCurrencies({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const currencyModule = container.resolve("currency");

  if (!currencyModule) {
    logger.error("Currency module not found");
    return;
  }

  const currenciesToInsert = Object.entries(defaultCurrencies).map(([code, currency]) => ({
    code: code.toLowerCase(),
    symbol: currency.symbol,
    symbol_native: currency.symbol_native,
    name: currency.name,
  }));

  logger.info(`Seeding ${currenciesToInsert.length} currencies...`);
  
  // Create them instead of upsert? 
  // Let's just create the ones that don't exist.
  const existing = await currencyModule.listCurrencies({}, { select: ["code"] });
  const existingCodes = new Set(existing.map((c: any) => c.code.toLowerCase()));

  const toCreate = currenciesToInsert.filter((c) => !existingCodes.has(c.code));

  if (toCreate.length > 0) {
    // createCurrencies takes an array
    await currencyModule.createCurrencies(toCreate);
    logger.info(`Created ${toCreate.length} currencies.`);
  } else {
    logger.info("All currencies already exist.");
  }
}
