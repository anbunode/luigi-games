import { MedusaContainer } from "@medusajs/types";

export default async function queryCurrencies({ container }: { container: MedusaContainer }) {
  const currencyModule = container.resolve("currency");

  const existing = await currencyModule.listCurrencies({}, { select: ["code", "name"] });
  console.log(`Total currencies: ${existing.length}`);
  if (existing.length > 0) {
      console.log(existing[0]);
  }
}
