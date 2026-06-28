import { model } from "@medusajs/framework/utils"

const SkrepayRegionCurrency = model.define("skrepay_region_currency", {
  id: model.id().primaryKey(),
  skrepay_region_id: model.text(),
  currency_code: model.text(),
  is_default: model.boolean().default(false),
})

export default SkrepayRegionCurrency
