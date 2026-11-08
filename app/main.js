const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1140,
    height: 780,
    minWidth: 920,
    minHeight: 660,
    frame: false,                       // janela sem moldura → chrome "Apple" via CSS
    backgroundColor: "#0a0b0f",
    titleBarStyle: "hidden",            // macOS: esconde a barra nativa (no-op no Linux)
    trafficLightPosition: { x: 18, y: 18 },
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
  win.once("ready-to-show", () => win.show());

  ipcMain.on("win:minimize", () => win.minimize());
  ipcMain.on("win:maximize", () => (win.isMaximized() ? win.unmaximize() : win.maximize()));
  ipcMain.on("win:close", () => win.close());

  // Salvar wordlist via diálogo nativo (o renderer não tem acesso ao disco).
  ipcMain.handle("save:wordlist", async (_e, content) => {
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: "wordlist.txt",
      filters: [{ name: "Texto", extensions: ["txt"] }],
    });
    if (canceled || !filePath) return { ok: false };
    fs.writeFileSync(filePath, content, "utf-8");
    return { ok: true, path: filePath };
  });
}

app.whenReady().then(createWindow);
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
