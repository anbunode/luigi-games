import { MedusaService } from "@medusajs/framework/utils"
import SkrepayRegion from "./models/skrepay-region"
import SkrepayRegionCountry from "./models/skrepay-region-country"
import SkrepayRegionCurrency from "./models/skrepay-region-currency"

class SkrepayRegionModuleService extends MedusaService({
  SkrepayRegion,
  SkrepayRegionCountry,
  SkrepayRegionCurrency,
}) {}

export default SkrepayRegionModuleService
