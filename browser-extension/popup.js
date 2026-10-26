"use strict";
const $ = (s) => document.querySelector(s);
let current = [];
const labels = {
  enable: "Etkinleştir",
  disable: "Devre dışı bırak",
  uninstall: "Kaldır",
  options: "Ayarları aç",
};
$("#extension-id").textContent = chrome.runtime.id;
async function render() {
  const state = await chrome.storage.local.get([
    "token",
    "port",
    "commands",
    "lastSync",
    "error",
  ]);
  if (document.activeElement.tagName !== "INPUT") {
    if (state.token) $("#connect [name=token]").value = state.token;
    $("#connect [name=port]").value = state.port || 47632;
  }
  $("#status").textContent =
    state.error ||
    (state.token
      ? `Son eşitleme: ${state.lastSync ? new Date(state.lastSync).toLocaleTimeString("tr-TR") : "Bekleniyor"}`
      : "Henüz bağlı değil");
  current = (state.commands || []).filter(
    (c) => Date.now() - c.createdAt < 300000,
  );
  $("#commands").replaceChildren();
  if (!current.length) $("#commands").textContent = "Bekleyen istek yok.";
  for (const command of current) {
    const box = document.createElement("div");
    box.className = "command";
    const title = document.createElement("strong");
    title.textContent = command.extensionName;
    const apply = document.createElement("button");
    apply.textContent = labels[command.action] || command.action;
    apply.dataset.id = command.id;
    apply.dataset.action = "apply";
    const reject = document.createElement("button");
    reject.textContent = "Reddet";
    reject.className = "secondary";
    reject.dataset.id = command.id;
    reject.dataset.action = "reject";
    const row = document.createElement("div");
    row.className = "row";
    row.append(apply, reject);
    box.append(title, row);
    $("#commands").append(box);
  }
}
async function result(c, ok, error) {
  const state = await chrome.storage.local.get(["results", "commands"]);
  await chrome.storage.local.set({
    results: [...(state.results || []), { id: c.id, ok, error }].slice(-30),
    commands: (state.commands || []).filter((x) => x.id !== c.id),
  });
  await chrome.runtime.sendMessage({ type: "sync" });
  await render();
}
$("#connect").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(e.target),
    token = String(data.get("token")),
    port = Number(data.get("port"));
  if (
    !/^plh_[a-f0-9]{64}$/.test(token) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    $("#status").textContent = "Geçerli Hub anahtarı ve port gerekli";
    return;
  }
  await chrome.storage.local.set({ token, port, commands: [], results: [] });
  await chrome.runtime.sendMessage({ type: "sync" });
  await render();
});
$("#refresh").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "sync" });
  await render();
});
$("#disconnect").addEventListener("click", async () => {
  await chrome.storage.local.clear();
  await chrome.action.setBadgeText({ text: "" });
  $("#connect [name=token]").value = "";
  await render();
});
$("#commands").addEventListener("click", async (e) => {
  const button = e.target.closest("button");
  if (!button) return;
  const c = current.find((c) => c.id === button.dataset.id);
  if (!c || Date.now() - c.createdAt > 300000) return;
  if (button.dataset.action === "reject")
    return result(c, false, "Kullanıcı tarayıcıda reddetti");
  button.disabled = true;
  try {
    let promise;
    if (c.action === "enable" || c.action === "disable")
      promise = chrome.management.setEnabled(
        c.extensionId,
        c.action === "enable",
      );
    else if (c.action === "uninstall")
      promise = chrome.management.uninstall(c.extensionId, {
        showConfirmDialog: true,
      });
    else if (c.action === "options") {
      // Called in the button gesture; read only browser supplied extension URLs.
      const item = await chrome.management.get(c.extensionId);
      if (!item.optionsUrl) throw Error("Bu eklentinin ayar sayfası yok");
      const u = new URL(item.optionsUrl);
      if (u.protocol !== "chrome-extension:" || u.hostname !== c.extensionId)
        throw Error("Ayar sayfasını tarayıcınızın eklenti ekranından açın");
      promise = chrome.tabs.create({ url: item.optionsUrl });
    } else throw Error("Bilinmeyen işlem");
    await promise;
    await result(c, true);
  } catch (error) {
    await result(c, false, error.message);
  }
});
render();
setInterval(
  () =>
    chrome.runtime
      .sendMessage({ type: "sync" })
      .then(render)
      .catch(() => {}),
  3000,
);
