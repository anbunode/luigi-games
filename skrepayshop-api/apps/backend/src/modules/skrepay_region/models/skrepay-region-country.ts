import { model } from "@medusajs/framework/utils"

const SkrepayRegionCountry = model.define("skrepay_region_country", {
  id: model.id().primaryKey(),
  skrepay_region_id: model.text(),
  iso_2: model.text(),
  display_name: model.text(),
})

export default SkrepayRegionCountry
