import { MedusaContainer } from "@medusajs/types";
import { defaultCurrencies, Modules } from "@medusajs/utils";

export default async function seedStoreCurrencies({ container }: { container: MedusaContainer }) {
  const storeModule = container.resolve(Modules.STORE);
  const stores = await storeModule.listStores({}, { relations: ["supported_currencies"] });
  
  if (stores.length === 0) {
      console.log("No stores found.");
      return;
  }
  
  // Get all currency codes from utils
  const allCurrencyCodes = Object.keys(defaultCurrencies).map(c => c.toLowerCase());
  
  for (const store of stores) {
      console.log(`Adding currencies to store ${store.id}...`);
      
      const existingCodes = store.supported_currencies?.map(sc => sc.currency_code) || [];
      const codesToAdd = allCurrencyCodes.filter(c => !existingCodes.includes(c));
      
      if (codesToAdd.length === 0) {
          console.log(`Store ${store.id} already has all currencies.`);
          continue;
      }
      
      const toInsert = codesToAdd.map(code => ({
          currency_code: code,
          is_default: existingCodes.length === 0 && code === "usd" ? true : false,
      }));
      
      // storeModule doesn't have addSupportedCurrencies directly maybe?
      // Wait, in v2 store module API:
      // it has updateStores({ id: store.id, supported_currencies: [...] })
      // Let's use it.
      
      const newSupportedCurrencies = [
          ...(store.supported_currencies?.map(sc => ({ currency_code: sc.currency_code, is_default: sc.is_default })) || []),
          ...toInsert
      ];
      
      // Let's check if the module allows updating currencies this way
      try {
          await storeModule.updateStores({
              id: store.id,
              supported_currencies: newSupportedCurrencies
          });
          console.log(`Successfully added currencies to store ${store.id}`);
      } catch (e) {
          console.error(`Failed to update store ${store.id}: ${e.message}`);
      }
  }
}
