import { model } from "@medusajs/framework/utils"
import SkrepayRegion from "./skrepay-region"

const SkrepayRegionCurrency = model.define("skrepay_region_currency", {
  id: model.id().primaryKey(),
  currency_code: model.text(),
  is_default: model.boolean().default(false),
  region: model.belongsTo(() => SkrepayRegion, {
    mappedBy: "currencies",
  }),
})

export default SkrepayRegionCurrency
