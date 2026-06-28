import { model } from "@medusajs/framework/utils"
import SkrepayRegion from "./skrepay-region"

const SkrepayRegionCountry = model.define("skrepay_region_country", {
  id: model.id().primaryKey(),
  iso_2: model.text(),
  display_name: model.text(),
  region: model.belongsTo(() => SkrepayRegion, {
    mappedBy: "countries",
  }),
})

export default SkrepayRegionCountry
