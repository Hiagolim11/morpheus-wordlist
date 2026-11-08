const { contextBridge, ipcRenderer } = require("electron");

// Ponte segura: expõe só o necessário ao renderer (contextIsolation ligado).
contextBridge.exposeInMainWorld("desktop", {
  minimize: () => ipcRenderer.send("win:minimize"),
  maximize: () => ipcRenderer.send("win:maximize"),
  close: () => ipcRenderer.send("win:close"),
  save: (content) => ipcRenderer.invoke("save:wordlist", content),
});
