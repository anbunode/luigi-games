import { MedusaContainer } from "@medusajs/types";

export default async function queryStore({ container }: { container: MedusaContainer }) {
  const storeModule = container.resolve("store");
  const stores = await storeModule.listStores({}, { relations: ["supported_currencies"] });
  console.log(`Total stores: ${stores.length}`);
  if (stores.length > 0) {
      console.log(stores[0].name);
      console.log(stores[0].supported_currencies);
  }
}
