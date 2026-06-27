import MacroRegionModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const MACRO_REGION_MODULE = "macro_region"

export default Module(MACRO_REGION_MODULE, {
  service: MacroRegionModuleService,
})
