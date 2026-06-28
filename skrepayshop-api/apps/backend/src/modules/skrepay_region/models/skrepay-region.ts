import { model } from "@medusajs/framework/utils"

const SkrepayRegion = model.define("skrepay_region", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),   // Aislamiento por tenant — UUID del skrepayshop_tenants
  name: model.text(),
  status: model.enum(["active", "draft"]).default("draft"),
})

export default SkrepayRegion
