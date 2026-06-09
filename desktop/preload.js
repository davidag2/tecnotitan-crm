const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tecnotitan", {
  dashboard: () => ipcRenderer.invoke("dashboard"),
  templates: () => ipcRenderer.invoke("templates"),
  leads: () => ipcRenderer.invoke("leads"),
  apolloSearch: (input) => ipcRenderer.invoke("apollo-search", input),
});
