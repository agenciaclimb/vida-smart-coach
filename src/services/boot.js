async function bootCore() {
  // ... o que já existe hoje: preload, SW check, etc.
}

export async function bootWithTimeout(ms = 2500) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("boot-timeout")), ms)
  );

  try {
    await Promise.race([bootCore(), timeout]);
  } catch (e) {
    // ❗ Não propague erro para a UI do login
    console.warn("Boot: edge-timeout, prosseguindo mesmo assim", e);
  }
}
