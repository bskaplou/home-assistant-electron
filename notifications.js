const { BrowserWindow, Notification } = require("electron")
const api = require("./api.js")

let notif = []

exports.show_persistent = function (ws, token, data) {
  for (let notification of data) {
    const ns = {
      title: notification.title,
      silent: true,
      subtitle: new Date(notification.created_at).toLocaleString(),
      body: notification.message,
      actions: [
        {
          type: "button",
          text: "Dismiss",
        },
      ],
    }

    const item = new Notification(ns)
    //Avoid garbage collection to be able to get callbacks
    notif.push(item)
    item.show()
    item.on("action", () => {
      api.dismiss_persistent_notification(ws, notification.notification_id)
    })
    item.onclick = () => {
      console.log("click")
    }
    item.on("click", () => {
      const token_url = token.hassUrl
      token_url.pathname = ""
      for (const win of BrowserWindow.getAllWindows()) {
        const content_url = new URL(win.webContents.getURL())
        content_url.pathname = ""
        const base_url = content_url.toString()
        if (base_url.startsWith(token_url.toString())) {
          content_url.pathname = "/developer-tools/logs"
          win.webContents.loadURL(content_url.toString())
          break
        }
      }
    })
  }
}
