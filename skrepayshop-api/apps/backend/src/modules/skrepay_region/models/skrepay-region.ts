import { model } from "@medusajs/framework/utils"
import SkrepayRegionCountry from "./skrepay-region-country"
import SkrepayRegionCurrency from "./skrepay-region-currency"

const SkrepayRegion = model.define("skrepay_region", {
  id: model.id().primaryKey(),
  name: model.text(),
  status: model.enum(["active", "draft"]).default("draft"),
  countries: model.hasMany(() => SkrepayRegionCountry, {
    foreignKey: "skrepay_region_id",
  }),
  currencies: model.hasMany(() => SkrepayRegionCurrency, {
    foreignKey: "skrepay_region_id",
  }),
})

export default SkrepayRegion
