// Modules to control application life and create native browser window
const { app, BrowserWindow, session } = require("electron")
const path = require("path")
const discovery = require("./discovery.js")
const menu = require("./menu.js")
const win = require("./window.js")
const bonjour = require("bonjour")()
const http = require("http")

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit()
  //app.quit()
})

app.on("activate", function () {
  //if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on("ready", () => {
  console.log("ready")
  menu.hosts()
  win.setup()
})
