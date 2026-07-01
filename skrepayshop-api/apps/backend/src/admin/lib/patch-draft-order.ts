/**
 * Native @medusajs/draft-order throws query errors during render (throwOnError,
 * if (isError) throw error). That crashes React Router even when our tenant shims
 * return valid data intermittently or the session is still hydrating.
 */
export function patchDraftOrderAdminSource(code: string): string | null {
  if (!code.includes("draftOrders.domain") || !code.includes("useDraftOrderTableQuery")) {
    return null
  }

  let patched = code
  let changed = false

  const listThrow = `if (isError) {
    throw error;
  }`
  const listThrowReplacement = `if (isError) {
    return /* @__PURE__ */ jsxs(Container, { className: "p-6", children: [
      /* @__PURE__ */ jsx(Heading, { children: "Draft orders" }),
      /* @__PURE__ */ jsx(Text, { className: "text-ui-fg-subtle mt-2", children: (error == null ? void 0 : error.message) ?? "Could not load draft orders. Refresh or sign in again." })
    ] });
  }`

  if (patched.includes(listThrow)) {
    patched = patched.replace(listThrow, listThrowReplacement)
    changed = true
  }

  const genericThrow = /if \(isError\) \{\s*throw error;\s*\}/g
  if (genericThrow.test(patched)) {
    patched = patched.replace(
      genericThrow,
      `if (isError) {
    console.error("[draft-orders]", error);
  }`
    )
    changed = true
  }

  const previewThrow = `if (isPreviewError) {
    throw previewError;
  }`
  if (patched.includes(previewThrow)) {
    patched = patched.replaceAll(
      previewThrow,
      `if (isPreviewError) {
    return null;
  }`
    )
    changed = true
  }

  const depThrows = [
    `if (regions.isError) {
    throw regions.error;
  }`,
    `if (salesChannels.isError) {
    throw salesChannels.error;
  }`,
    `if (customers.isError) {
    throw customers.error;
  }`,
    `if (isOrderChangesError) {
    throw orderChangesError;
  }`,
  ]

  for (const block of depThrows) {
    if (patched.includes(block)) {
      patched = patched.replaceAll(block, "")
      changed = true
    }
  }

  if (patched.includes("throwOnError: true")) {
    patched = patched.replaceAll("throwOnError: true", "throwOnError: false")
    changed = true
  }

  const unsafeParse =
    /created_at: created_at \? JSON\.parse\(created_at\) : void 0,\s*updated_at: updated_at \? JSON\.parse\(updated_at\) : void 0/

  if (unsafeParse.test(patched)) {
    patched = patched.replace(
      unsafeParse,
      `created_at: created_at ? (() => { try { return JSON.parse(created_at); } catch { return void 0; } })() : void 0,
    updated_at: updated_at ? (() => { try { return JSON.parse(updated_at); } catch { return void 0; } })() : void 0`
    )
    changed = true
  }

  return changed ? patched : null
}

export function patchDraftOrderBundleChunk(
  code: string,
  fileName?: string
): string | null {
  if (!fileName?.startsWith("index-") || !code.includes("draftOrders.domain")) {
    return null
  }

  return patchDraftOrderAdminSource(code)
}
