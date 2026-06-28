import SkrepayRegionModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const SKREPAY_REGION_MODULE = "skrepay_region"

export default Module(SKREPAY_REGION_MODULE, {
  service: SkrepayRegionModuleService,
})
