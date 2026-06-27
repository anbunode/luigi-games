import { model } from "@medusajs/framework/utils"

const MacroRegion = model.define("macro_region", {
  id: model.id().primaryKey(),
  name: model.text(),
})

export default MacroRegion
