// The extension never needs the network to audit a page, so a test that reaches for it is missing
// a stub. Assigned directly rather than through vi.stubGlobal so `unstubGlobals` keeps it in place.
globalThis.fetch = () => {
  throw new Error('Network access is disabled in tests.')
}
