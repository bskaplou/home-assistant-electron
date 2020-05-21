//Collection of fragile methods of interactions with HA frontend

const { BrowserWindow, nativeImage } = require("electron")

const cache = {}
exports.theme_icon = function (side, theme) {
  const substitute_vars = function (str) {
    return str.replace(/var\(--(.*?)\)/g, (match, p1, offset, string) => {
      return substitute_vars(theme[p1])
    })
  }

  const color_string = substitute_vars(theme["primary-color"])
  if (cache[color_string]) {
    theme.icon = cache[color_string]
    return Promise.resolve()
  }

  const win = BrowserWindow.getAllWindows()[0]

  return win.webContents
    .executeJavaScript(
      `
      electron_c = document.createElement('canvas')
      electron_c.width = electron_c.height = ${side}
      electron_ctx = electron_c.getContext('2d')
      electron_ctx.fillStyle = '${color_string}'
      electron_ctx.beginPath();
      electron_ctx.arc(${side} / 2, ${side} / 2, ${side} / 2, 0, 2 * Math.PI, false);
      electron_ctx.fill()
      electron_c.toDataURL()
    `,
      true
    )
    .then((data_image) => {
      cache[color_string] = theme.icon = nativeImage.createEmpty()
      theme.icon.addRepresentation({
        scaleFactor: 1,
        width: side,
        heigth: side,
        dataURL: data_image,
      })
      win.webContents
        .executeJavaScript(
          `
        electron_c = document.createElement('canvas')
        electron_c.width = electron_c.height = ${side * 2}
        electron_ctx = electron_c.getContext('2d')
        electron_ctx.fillStyle = '${color_string}'
        electron_ctx.beginPath();
        electron_ctx.arc(${side}, ${side}, ${side}, 0, 2 * Math.PI, false);
        electron_ctx.fill()
        electron_c.toDataURL()
      `,
          true
        )
        .then((data_image) => {
          theme.icon.addRepresentation({
            scaleFactor: 2,
            width: side,
            heigth: side,
            dataURL: data_image,
          })
        })
    })
}

exports.service_select = function (state) {
  return `localStorage.setItem("panel-dev-service-state-domain-service", "\\"${state}\\"");`
}

exports.theme_select = function (theme) {
  return `localStorage.setItem("selectedTheme", "\\"${theme}\\"");`
}

exports.current_theme = function (win, callback) {
  return win.webContents
    .executeJavaScript(`localStorage.getItem("selectedTheme")`, true)
    .then((theme) => callback(theme ? theme.replace(/"/g, "") : theme))
}

exports.state_click = function (device) {
  return `
    links = document
      .querySelector("home-assistant").shadowRoot
      .querySelector("home-assistant-main").shadowRoot
      .querySelector("ha-panel-developer-tools").shadowRoot
      .querySelector("developer-tools-state").shadowRoot
      .querySelectorAll("a")
    for(let link of links) {
      if(link.innerText == "${device}") {
        link.click()
        break
      }
    }
  `
}

exports.set_theme = function (win, theme) {
  const js = `localStorage.setItem("selectedTheme", "\\"${theme}\\"");`
  win.webContents.executeJavaScript(js, true)
  let target_url = new URL(win.webContents.getURL())
  target_url.pathname = ""
  target_url = target_url.toString()
  for (const win of BrowserWindow.getAllWindows()) {
    const current = new URL(win.webContents.getURL()).toString()
    if (current.startsWith(target_url)) {
      win.webContents.reload()
    }
  }
}

exports.drag_injector = function (win) {
  const profile = `
    try {
      document.querySelector("home-assistant").shadowRoot
        .querySelector("home-assistant-main").shadowRoot
        .querySelector("ha-panel-profile").shadowRoot
        .querySelector("app-header")
        .style.webkitAppRegion = "drag"
    } catch(error) {
      console.log(error)
    }
  `
  const dashboard = `
    try {
      document.querySelector("home-assistant").shadowRoot
        .querySelector("home-assistant-main").shadowRoot
        .querySelector("ha-panel-lovelace").shadowRoot
        .querySelector("hui-root").shadowRoot
        .querySelector("app-header")
        .style.webkitAppRegion = "drag"
    } catch(error) {
      console.log(error)
    }
  `
  const js_edit = `
    try {
      document.querySelector("home-assistant").shadowRoot
        .querySelector("home-assistant-main").shadowRoot
        .querySelector("ha-config-script").shadowRoot
        .querySelector("ha-script-editor").shadowRoot
        .querySelector("hass-tabs-subpage").shadowRoot
        .querySelector("div.toolbar").style.webkitAppRegion = "drag"
    } catch(error) {
      console.log(error)
    }
  `

  const automation_edit = `
    try {
      document.querySelector("home-assistant").shadowRoot
        .querySelector("home-assistant-main").shadowRoot
        .querySelector("ha-config-automation").shadowRoot
        .querySelector("ha-automation-editor").shadowRoot
        .querySelector("hass-tabs-subpage").shadowRoot
        .querySelector("div.toolbar").style.webkitAppRegion = "drag"
    } catch(error) {
      console.log(error)
    }
  `

  setTimeout(() => {
    win.webContents.executeJavaScript(profile, true)
    win.webContents.executeJavaScript(dashboard, true)
    win.webContents.executeJavaScript(js_edit, true)
    win.webContents.executeJavaScript(automation_edit, true)
  }, 300)
  setTimeout(() => {
    win.webContents.executeJavaScript(profile, true)
    win.webContents.executeJavaScript(dashboard, true)
    win.webContents.executeJavaScript(js_edit, true)
    win.webContents.executeJavaScript(automation_edit, true)
  }, 800)
}
