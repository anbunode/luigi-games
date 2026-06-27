import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { MACRO_REGION_MODULE } from "../../../modules/macro_region"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve("query")
  
  const { data: macroRegions } = await query.graph({
    entity: "macro_region",
    fields: ["id", "name", "regions.*"],
  })

  res.json({
    macro_regions: macroRegions,
  })
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const macroRegionModule = req.scope.resolve(MACRO_REGION_MODULE) as any
  
  const macroRegion = await macroRegionModule.createMacroRegions(req.body)

  res.json({
    macro_region: macroRegion,
  })
}
