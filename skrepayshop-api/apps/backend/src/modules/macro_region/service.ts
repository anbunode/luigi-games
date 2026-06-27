import { MedusaService } from "@medusajs/framework/utils"
import MacroRegion from "./models/macro-region"

class MacroRegionModuleService extends MedusaService({
  MacroRegion,
}) {}

export default MacroRegionModuleService
