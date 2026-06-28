import { model } from "@medusajs/framework/utils"

const SkrepayRegion = model.define("skrepay_region", {
  id: model.id().primaryKey(),
  name: model.text(),
  status: model.enum(["active", "draft"]).default("draft"),
})

export default SkrepayRegion
