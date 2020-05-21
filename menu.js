const {
  BrowserWindow,
  app,
  Menu,
  MenuItem,
  TouchBar,
  nativeImage,
} = require("electron")
const { TouchBarButton, TouchBarLabel } = TouchBar
const discovery = require("./discovery.js")
const win = require("./window.js")
const api = require("./api.js")
const mdi = require("./mdi.js")
const magic = require("./magic.js")
const { URL } = require("url")
const lodash = require("lodash")

let hosts_data = []
let panels_data = {}
let services_data = {}
let states_data = []
let themes_data = {}
let current_theme

function build_automations_menu() {
  if (states_data.length > 0) {
    const automations_menu = new Menu()
    const automations_menu_item = new MenuItem({
      label: "Automations",
      type: "submenu",
      //icon: mdi.path('mdi:robot'),
      submenu: automations_menu,
    })
    automations_menu.append(
      new MenuItem({
        label: "List...",
        click: (menuItem, browserWindow, event) => {
          const target_url = new URL(browserWindow.webContents.getURL())
          target_url.pathname = "/config/automation"
          console.log("RUN>", target_url.toString())
          browserWindow.webContents.loadURL(target_url.toString())
        },
      })
    )
    automations_menu.append(
      new MenuItem({
        label: "Reload",
        click: (menuItem, browserWindow, event) => {
          api.automation_reload(browserWindow.webContents.getURL(), (data) => {
            console.log("AUTOMATION RELOADED", data)
          })
        },
      })
    )

    automations_menu.append(
      new MenuItem({
        type: "separator",
      })
    )
    automations_menu.append(
      new MenuItem({
        label: "Edit",
        icon: mdi.path("mdi:screwdriver"),
        enabled: false,
      })
    )

    for (let item of states_data) {
      if (item.entity_id.startsWith("automation.")) {
        const settings = {
          label: item.attributes.friendly_name || item.entity_id.split(".")[1],
          click: (menuItem, browserWindow, event) => {
            const target_url = new URL(browserWindow.webContents.getURL())
            ;(target_url.pathname =
              "/config/automation/edit/" + item.attributes.id),
              console.log("RUN>", target_url.toString())
            browserWindow.webContents.loadURL(target_url.toString())
          },
        }
        if (item.attributes && item.attributes.restored == true) {
          settings.enabled = false
          settings.icon = mdi.path("mdi:led-variant-off")
        } else {
          settings.icon =
            item.state == "on"
              ? mdi.path("mdi:led-off")
              : mdi.path("mdi:led-outline")
        }
        automations_menu.append(new MenuItem(settings))
      }
    }
    return automations_menu_item
  }
}

function build_scenes_menu() {
  if (states_data.length > 0) {
    const scenes_menu = new Menu()
    const scenes_menu_item = new MenuItem({
      label: "Scenes",
      type: "submenu",
      submenu: scenes_menu,
    })

    scenes_menu.append(
      new MenuItem({
        label: "List...",
        click: (menuItem, browserWindow, event) => {
          const target_url = new URL(browserWindow.webContents.getURL())
          target_url.pathname = "/config/scene/dashboard"
          console.log("RUN>", target_url.toString())
          browserWindow.webContents.loadURL(target_url.toString())
        },
      })
    )
    scenes_menu.append(
      new MenuItem({
        label: "Reload",
        click: (menuItem, browserWindow, event) => {
          api.scene_reload(browserWindow.webContents.getURL(), (data) => {
            console.log("SCENE RELOADED", data)
          })
        },
      })
    )
    scenes_menu.append(
      new MenuItem({
        type: "separator",
      })
    )

    scenes_menu.append(
      new MenuItem({
        label: "Edit",
        icon: mdi.path("mdi:screwdriver"),
        enabled: false,
      })
    )

    for (let item of states_data) {
      if (item.entity_id.startsWith("scene.")) {
        const settings = {
          label: item.attributes.friendly_name || item.entity_id.split(".")[1],
          click: (menuItem, browserWindow, event) => {
            const target_url = new URL(browserWindow.webContents.getURL())
            target_url.pathname = "/config/scene/edit/" + item.attributes.id
            console.log("RUN>", target_url.toString())
            browserWindow.webContents.loadURL(target_url.toString())
          },
        }
        scenes_menu.append(new MenuItem(settings))
      }
    }

    return scenes_menu_item
  }
}

function build_scripts_menu() {
  if (services_data.script) {
    const scripts_menu = new Menu()
    const scripts_menu_item = new MenuItem({
      label: "Scripts",
      type: "submenu",
      submenu: scripts_menu,
    })

    scripts_menu.append(
      new MenuItem({
        label: "Run...",
        click: (menuItem, browserWindow, event) => {
          const target_url = new URL(browserWindow.webContents.getURL())
          target_url.pathname = "/config/script"
          console.log("RUN>", target_url.toString())
          browserWindow.webContents.loadURL(target_url.toString())
        },
      })
    )
    scripts_menu.append(
      new MenuItem({
        label: "Reload",
        click: (menuItem, browserWindow, event) => {
          api.script_reload(browserWindow.webContents.getURL(), (data) => {
            console.log("SCRIPT RELOADED", data)
          })
        },
      })
    )

    scripts_menu.append(
      new MenuItem({
        type: "separator",
      })
    )
    scripts_menu.append(
      new MenuItem({
        label: "Edit",
        icon: mdi.path("mdi:screwdriver"),
        enabled: false,
      })
    )

    for (let [name, _] of Object.entries(services_data.script).sort((a, b) =>
      a[0] > b[0] ? 1 : -1
    )) {
      const settings = {
        label: name,
        click: (menuItem, browserWindow, event) => {
          const target_url = new URL(browserWindow.webContents.getURL())
          target_url.pathname = "/config/script/edit/script." + name
          console.log("RUN>", target_url.toString())
          browserWindow.webContents.loadURL(target_url.toString())
        },
      }
      scripts_menu.append(new MenuItem(settings))
    }

    return scripts_menu_item
  }
}

function build_edit_menu() {
  const edit_menu = new Menu()
  const edit_menu_item = new MenuItem({
    label: "Edit",
    type: "submenu",
    submenu: edit_menu,
  })
  edit_menu.append(new MenuItem({ role: "undo" }))
  edit_menu.append(new MenuItem({ role: "redo" }))
  edit_menu.append(new MenuItem({ type: "separator" }))
  edit_menu.append(new MenuItem({ role: "cut" }))
  edit_menu.append(new MenuItem({ role: "copy" }))
  edit_menu.append(new MenuItem({ role: "paste" }))
  if (process.platform === "darwin") {
    edit_menu.append(new MenuItem({ role: "pasteAndMatchStyle" }))
  }
  edit_menu.append(new MenuItem({ role: "delete" }))
  edit_menu.append(new MenuItem({ role: "selectAll" }))
  return edit_menu_item
}

function build_app_menu() {
  const app_menu = new Menu()
  const app_menu_item = new MenuItem({
    label: "HomeAssistant",
    type: "submenu",
    submenu: app_menu,
  })

  app_menu.append(
    new MenuItem({
      role: "about",
    })
  )
  app_menu.append(new MenuItem({ type: "separator" }))
  app_menu.append(
    new MenuItem({
      label: "Developer Tools Info",
      click: (menuItem, browserWindow, event) => {
        const about_url = new URL(browserWindow.webContents.getURL())
        about_url.pathname = "/developer-tools/info"
        //console.log(about_url.toString())
        browserWindow.loadURL(about_url.toString())
      },
    })
  )
  app_menu.append(
    new MenuItem({
      label: "Debug events fire/listen...",
      click: (menuItem, browserWindow, event) => {
        const about_url = new URL(browserWindow.webContents.getURL())
        about_url.pathname = "/developer-tools/event"
        browserWindow.loadURL(about_url.toString())
      },
    })
  )
  app_menu.append(
    new MenuItem({
      label: "Restart server",
      click: (menuItem, browserWindow, event) => {
        api.server_restart(browserWindow.webContents.getURL(), (data) => {
          console.log("SERVER RESTART", data)
        })
      },
    })
  )
  app_menu.append(new MenuItem({ type: "separator" }))

  for (let url of hosts_data) {
    const settings = {
      label: url,
      click: (menuItem, browserWindow, event) => {
        win.open(url)
      },
    }
    if (url.startsWith("https://")) {
      settings.icon = mdi.path("mdi:lock")
    }
    app_menu.append(new MenuItem(settings))
  }
  app_menu.append(
    new MenuItem({
      type: "separator",
    })
  )

  app_menu.append(
    new MenuItem({
      role: "quit",
    })
  )

  return app_menu_item
}

function build_dashboards_menu(win) {
  if (Object.keys(panels_data).length > 0) {
    const panels = new Menu()
    const touchbar_items = []
    const themes_menu = build_themes_menu()
    if (themes_menu) {
      panels.append(themes_menu)
      panels.append(
        new MenuItem({
          type: "separator",
        })
      )
    }
    for (let [id, item] of Object.entries(panels_data)) {
      if (item.component_name == "lovelace") {
        const label = id == "lovelace" ? "Overview" : item.title || id
        const settings = {
          label: label,
          click: (menuItem, browserWindow, event) => {
            const url = new URL(browserWindow.webContents.getURL())
            url.pathname = "/" + item.url_path
            browserWindow.webContents.loadURL(url.toString())
          },
        }
        const tb_settings = {
          label: label,
          click: () => {
            const url = new URL(win.webContents.getURL())
            url.pathname = "/" + item.url_path
            win.webContents.loadURL(url.toString())
          },
        }
        if (item.icon && item.icon.startsWith("mdi:")) {
          tb_settings.icon = settings.icon = mdi.path(item.icon)
          tb_settings.iconPosition = "left"
        } else if (id == "lovelace") {
          tb_settings.icon = settings.icon = mdi.path("mdi:view-dashboard")
          tb_settings.iconPosition = "left"
        }
        touchbar_items.push(new TouchBarButton(tb_settings))
        panels.append(new MenuItem(settings))
      }
    }
    panels.append(
      new MenuItem({
        type: "separator",
      })
    )

    panels.append(
      new MenuItem({
        label: "Edit...",
        click: (menuItem, browserWindow, event) => {
          let url = new URL(browserWindow.webContents.getURL())
          url.pathname = "/config/lovelace/dashboards"
          browserWindow.loadURL(url.toString())
        },
      })
    )
    const panels_item = new MenuItem({
      label: "\u2665 Panels",
      type: "submenu",
      submenu: panels,
    })

    if (win) {
      const touchbar = new TouchBar({
        items: touchbar_items,
      })
      win.setTouchBar(touchbar)
    }
    return panels_item
  }
}

function build_services_menu() {
  if (Object.keys(services_data).length > 0) {
    const services = new Menu()
    for (let [service, methods] of Object.entries(services_data).sort((a, b) =>
      a[0] > b[0] ? 1 : -1
    )) {
      const methods_menu = new Menu()
      const service_item = new MenuItem({
        type: "submenu",
        label: service,
        submenu: methods_menu,
      })
      for (let [method_name, details] of Object.entries(methods).sort((a, b) =>
        a[0] > b[0] ? 1 : -1
      )) {
        methods_menu.append(
          new MenuItem({
            label: method_name,
            click: (menuItem, browserWindow, event) => {
              const url_string = browserWindow.webContents.getURL()
              const url = new URL(url_string)
              url.pathname = "/developer-tools/service"
              browserWindow.webContents
                .executeJavaScript(
                  magic.service_select(service + "." + method_name),
                  true
                )
                .then((data) =>
                  browserWindow.webContents.loadURL(url.toString())
                )
            },
          })
        )
      }
      services.append(service_item)
    }

    const services_item = new MenuItem({
      label: "Services",
      type: "submenu",
      submenu: services,
    })

    return services_item
  }
}

function build_themes_menu() {
  if (Object.entries(themes_data).length > 0) {
    const themes_menu = new Menu()
    const themes_menu_item = new MenuItem({
      label: "Themes",
      type: "submenu",
      submenu: themes_menu,
    })

    for (let [id, data] of Object.entries(themes_data.themes).sort((a, b) =>
      a[0] > b[0] ? 1 : -1
    )) {
      const settings = {
        label: id,
        type: "checkbox",
        checked: current_theme == id,
        click: (menuItem, browserWindow, event) => {
          magic.set_theme(browserWindow, id)
          //console.log(id)
        },
      }

      if (data && data.icon) {
        settings.icon = data.icon
      }

      themes_menu.append(new MenuItem(settings))
    }
    return themes_menu_item
  }
}

function _rebuild_menu(win) {
  console.log("REBUILD")
  const top = new Menu()
  top.append(build_app_menu(win))

  const edit_menu = build_edit_menu(win)
  if (edit_menu) {
    top.append(edit_menu)
  }

  const dashboards_menu = build_dashboards_menu(win)
  if (dashboards_menu) {
    top.append(dashboards_menu)
  }

  const automations_menu = build_automations_menu()
  if (automations_menu) {
    top.append(automations_menu)
  }

  const scenes_menu = build_scenes_menu()
  if (scenes_menu) {
    top.append(scenes_menu)
  }

  const scripts_menu = build_scripts_menu()
  if (scripts_menu) {
    top.append(scripts_menu)
  }

  const services_menu = build_services_menu()
  if (services_menu) {
    top.append(services_menu)
  }

  if (states_data.length > 0) {
    const folded_statuses = {}
    for (let state of states_data) {
      const [group, device] = state.entity_id.split(".")
      if (!folded_statuses[group]) {
        folded_statuses[group] = []
      }
      folded_statuses[group].push(state)
    }
    const states = new Menu()
    states.append(
      new MenuItem({
        label: "History...",
        click: (menuItem, browserWindow, event) => {
          const url_string = browserWindow.webContents.getURL()
          const url = new URL(url_string)
          url.pathname = "/history"
          browserWindow.webContents.loadURL(url.toString())
        },
      })
    )
    states.append(
      new MenuItem({
        type: "separator",
      })
    )

    for (let [group, device_list] of Object.entries(
      folded_statuses
    ).sort((a, b) => (a[0] > b[0] ? 1 : -1))) {
      const devices = new Menu()
      for (const device of device_list.sort((a, b) =>
        a.entity_id.split(".")[1] > b.entity_id.split(".")[1] ? 1 : -1
      )) {
        const label = device.entity_id.split(".")[1]
        const settings = {
          label: label,
          click: (menuItem, browserWindow, event) => {
            const url_string = browserWindow.webContents.getURL()
            const url = new URL(url_string)
            url.pathname = "/developer-tools/state"
            if (url.toString() == url_string) {
              browserWindow.webContents.executeJavaScript(
                magic.state_click(device.entity_id),
                true
              )
            } else {
              browserWindow.webContents.loadURL(url.toString())
              browserWindow.webContents.once("dom-ready", () => {
                setTimeout(() => {
                  browserWindow.webContents
                    .executeJavaScript(
                      magic.state_click(device.entity_id),
                      true
                    )
                    .then((data) => console.log("Click!"))
                }, 500)
              })
            }
          },
        }

        if (device.attributes && device.attributes.unit_of_measurement) {
          settings.label =
            settings.label +
            " = " +
            device.state +
            " " +
            device.attributes.unit_of_measurement
        }

        if (device.attributes && device.attributes.icon) {
          settings.icon = mdi.path(device.attributes.icon)
        } else {
          const state_mdi_mapping = {
            on: "mdi:led-on",
            off: "mdi:led-outline",
            unavailable: "mdi:led-variant-off",
            not_home: "mdi:run-fast",
            home: "mdi:home",
          }
          if (state_mdi_mapping[device.state]) {
            settings.icon = mdi.path(state_mdi_mapping[device.state])
          }
        }

        devices.append(new MenuItem(settings))
      }

      states.append(
        new MenuItem({
          label: group,
          type: "submenu",
          submenu: devices,
        })
      )
    }
    const states_item = new MenuItem({
      label: "States",
      type: "submenu",
      submenu: states,
    })
    top.append(states_item)
  }

  console.log("REBUILD DONE")
  Menu.setApplicationMenu(top)
}

const rebuild_menu = lodash.debounce(_rebuild_menu, 100)

exports.cleanup_window_menu = function () {
  panels_data = {}
  services_data = {}
  states_data = []
  themes_data = {}
  rebuild_menu()
}

exports.panels_services_states_themes = lodash.debounce(function (url, win) {
  exports.cleanup_window_menu()
  magic.current_theme(win, (theme) => {
    current_theme = theme
  })
  api.panels(url, (panels) => {
    panels_data = panels
    api.services(url, (services) => {
      services_data = services
      api.states(url, (states) => {
        states_data = states
        api.themes(url, (themes) => {
          let prom = Promise.resolve()
          themes.themes["default"] = {
            "primary-color": "#03a9f4",
          }
          for (let [name, data] of Object.entries(themes.themes)) {
            prom = prom.then(() => magic.theme_icon(16, data))
          }
          prom.then(() => {
            themes_data = themes
            rebuild_menu(win)
          })
        })
      })
    })
  })
}, 100)

exports.hosts = function () {
  discovery.find((urls) => {
    hosts_data = urls
    rebuild_menu()
  })
}
