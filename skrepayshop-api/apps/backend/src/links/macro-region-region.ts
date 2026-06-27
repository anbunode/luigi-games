import MacroRegionModule from "../modules/macro_region"
import RegionModule from "@medusajs/region"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  MacroRegionModule.linkable.macroRegion,
  {
    linkable: RegionModule.linkable.region,
    isList: true,
  }
)
