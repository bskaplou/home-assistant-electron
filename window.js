// Modules to control application life and create native browser window
const { URL } = require("url")
const { BrowserWindow, app, TouchBar } = require("electron")
const { TouchBarButton, TouchBarLabel } = TouchBar
const Store = new require("electron-store")
const store = new Store()
const path = require("path")
const { v4: uuid } = require("uuid")
const api = require("./api.js")
const menu = require("./menu.js")
const magic = require("./magic.js")
const mdi = require("./mdi.js")

exports.setup = function () {
  const list = store.get("windows", {})
  for (let [id, [url, bounds]] of Object.entries(list)) {
    exports.open(url, id, bounds)
  }
}

function set_window(id, url, bounds) {
  const list = store.get("windows", {})
  list[id] = [url, bounds]
  store.set("windows", list)
}

let before_quit = false
function del_window(id) {
  const list = store.get("windows", {})
  if (Object.keys(list).length > 1 && !before_quit) {
    delete list[id]
    store.set("windows", list)
  }
}

app.on("before-quit", () => (before_quit = true))

exports.open = function (orig_url, id = undefined, bounds = undefined) {
  // Normalize URL
  const url = new URL(orig_url).toString()

  const window_id = id ? id : uuid()
  if (id == undefined) {
    set_window(window_id, url, bounds)
  }
  const settings = {
    width: 800,
    height: 600,
    frame: false,
    acceptFirstMouse: true,
    titleBarStyle: "hidden",
    backgroundColor: "#33A9D",
    icon: __dirname + "/home_assistant_logo.icns",
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: true,
    },
  }
  if (bounds) {
    settings.x = bounds.x
    settings.y = bounds.y
    settings.width = bounds.width
    settings.height = bounds.height
  }
  const url_window = new BrowserWindow(settings)

  url_window.loadURL(url)
  url_window.on("close", () => del_window(window_id))
  let first_dom_ready = false

  url_window.webContents.on("dom-ready", () => {
    first_dom_ready = true
    set_window(
      window_id,
      url_window.webContents.getURL(),
      url_window.getBounds()
    )
    menu.panels_services_states_themes(url, url_window)
    magic.drag_injector(url_window)
  })

  url_window.webContents.on("did-navigate-in-page", () => {
    first_dom_ready = true
    console.log("DNIP", url_window.webContents.getURL())
    set_window(
      window_id,
      url_window.webContents.getURL(),
      url_window.getBounds()
    )
    menu.panels_services_states_themes(url, url_window)
    magic.drag_injector(url_window)
  })

  url_window.on("focus", () => {
    first_dom_ready && menu.panels_services_states_themes(url, url_window)
    console.log("FOCUS")
  })

  url_window.on("close", () => {
    menu.cleanup_window_menu()
    console.log("CLOSE")
  })

  function save_size() {
    set_window(window_id, url, url_window.getBounds())
  }

  url_window.on("move", () => save_size())
  url_window.on("resize", () => save_size())
  //url_window.webContents.openDevTools()
}
