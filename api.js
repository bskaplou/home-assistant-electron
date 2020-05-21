const { BrowserWindow, Notification } = require("electron")
const http = require("https")
const { URL } = require("url")
const WebSocket = require("ws")
const { v4: uuid } = require("uuid")
const menu = require("./menu.js")
const notifications = require("./notifications.js")

function with_token(hassUrl, callback) {
  function got_token(token) {
    if (token) {
      const parsed_token = JSON.parse(token)
      callback(parsed_token)
    }
  }

  const base_urls = []
  let p = Promise.resolve()
  for (const win of BrowserWindow.getAllWindows()) {
    const content_url = new URL(win.webContents.getURL())
    content_url.pathname = ""
    const base_url = content_url.toString()

    if (!base_urls.includes(base_url) && hassUrl.startsWith(base_url)) {
      base_urls.push(base_url)
      const wp = win.webContents.executeJavaScript(
        'localStorage.getItem("hassTokens");',
        true
      )
      p = p.then((token) => {
        got_token(token)
        return wp
      })
    }
  }
  p.then((token) => got_token(token))
}

function socket_url(hassUrl) {
  const url = new URL(hassUrl)
  url.protocol = url.protocol == "https:" ? "wss:" : "ws:"
  url.pathname = "/api/websocket"
  return url.toString()
}

const token_sockets = {}

function get_socket(token, callback) {
  const socket_id = token.hassUrl
  if (token_sockets[socket_id]) {
    callback(token_sockets[socket_id])
  } else {
    console.log("CREATE SOCKET " + token.hassUrl)
    const ws = new WebSocket(socket_url(token.hassUrl))
    ws.once("message", (data) => {
      const jd = JSON.parse(data)
      if (jd.type == "auth_required") {
        ws.send(
          JSON.stringify({
            type: "auth",
            access_token: token.access_token,
          })
        )
        ws.once("message", (data) => {
          const auth_response = JSON.parse(data)
          if (auth_response.type == "auth_ok") {
            const message_id_callbacks = {}
            ws.once_for_id = function (id, callback) {
              message_id_callbacks[id] = [callback, "once"]
            }
            ws.subscribe_for_id = function (id, callback) {
              message_id_callbacks[id] = [callback, "subscribe"]
            }
            ws.on("error", (data) => {
              delete token_sockets[socket_id]
            })
            ws.on("close", (data) => {
              delete token_sockets[socket_id]
            })
            ws.on("message", (data) => {
              const parsed_data = JSON.parse(data)
              const id = parsed_data.id
              if (parsed_data.id && message_id_callbacks[id]) {
                const [callback, type] = message_id_callbacks[id]
                callback(parsed_data)
                if (type == "once") {
                  delete message_id_callbacks[id]
                }
              }
            })
            token_sockets[socket_id] = ws
            get_persistent_notifications(ws, (data) =>
              notifications.show_persistent(ws, token, data)
            )
            subscribe_persistent_notifications(ws, () => {
              get_persistent_notifications(ws, (data) =>
                notifications.show_persistent(ws, token, data)
              )
            })
            callback(ws)
          } else {
            // no sucessful socket => no callback => authorize first
            //callback()
          }
        })
      }
    })
  }
}

let message_id = 1
function wsid() {
  return message_id++
}

function subscribe_persistent_notifications(ws, callback) {
  const id = wsid()
  ws.subscribe_for_id(id, (data) => {
    if (data.event) {
      callback(data.result)
    }
  })
  ws.send(
    JSON.stringify({
      type: "subscribe_events",
      event_type: "persistent_notifications_updated",
      id: id,
    })
  )
}

function get_panels(ws, callback) {
  const id = wsid()
  ws.once_for_id(id, (data) => {
    callback(data.result)
  })
  ws.send(
    JSON.stringify({
      type: "get_panels",
      id: id,
    })
  )
}

function get_persistent_notifications(ws, callback) {
  const id = wsid()
  ws.once_for_id(id, (data) => {
    callback(data.result)
  })
  ws.send(
    JSON.stringify({
      type: "persistent_notification/get",
      id: id,
    })
  )
}

exports.dismiss_persistent_notification = function (ws, notification_id) {
  const id = wsid()
  ws.send(
    JSON.stringify({
      type: "call_service",
      domain: "persistent_notification",
      service: "dismiss",
      service_data: {
        notification_id: notification_id,
      },
      id: id,
    })
  )
}

function get_services(ws, callback) {
  const id = wsid()
  ws.once_for_id(id, (data) => {
    callback(data.result)
  })
  ws.send(
    JSON.stringify({
      type: "get_services",
      id: id,
    })
  )
}

function get_states(ws, callback) {
  const id = wsid()
  ws.once_for_id(id, (data) => {
    callback(data.result)
  })
  ws.send(
    JSON.stringify({
      type: "get_states",
      id: id,
    })
  )
}

//U can get lang here
function get_user_data(ws, callback) {
  const id = wsid()
  ws.once_for_id(id, (data) => {
    //callback(data.result)
    console.log(data.result)
  })
  ws.send(
    JSON.stringify({
      type: "frontend/get_user_data",
      id: id,
    })
  )
}

function get_themes(ws, callback) {
  const id = wsid()
  ws.once_for_id(id, (data) => {
    callback(data.result)
    //console.log(data.result)
  })
  ws.send(
    JSON.stringify({
      type: "frontend/get_themes",
      id: id,
    })
  )
}

function script_reload(ws, callback) {
  const id = wsid()
  ws.once_for_id(id, (data) => {
    callback(data)
    //console.log(data.result)
  })
  ws.send(
    JSON.stringify({
      type: "call_service",
      domain: "script",
      service: "reload",
      id: id,
    })
  )
}

function scene_reload(ws, callback) {
  const id = wsid()
  ws.once_for_id(id, (data) => {
    callback(data)
    //console.log(data.result)
  })
  ws.send(
    JSON.stringify({
      type: "call_service",
      domain: "scene",
      service: "reload",
      id: id,
    })
  )
}

function automation_reload(ws, callback) {
  const id = wsid()
  ws.once_for_id(id, (data) => {
    callback(data)
    //console.log(data.result)
  })
  ws.send(
    JSON.stringify({
      type: "call_service",
      domain: "automation",
      service: "reload",
      id: id,
    })
  )
}

function server_restart(ws, callback) {
  const id = wsid()
  ws.once_for_id(id, (data) => {
    callback(data)
  })
  ws.send(
    JSON.stringify({
      type: "call_service",
      domain: "homeassistant",
      service: "restart",
      id: id,
    })
  )
}

function _method_builder(impl) {
  return function (url, callback) {
    with_token(url, (token) => {
      get_socket(token, (socket) => {
        impl(socket, (themes) => {
          callback(themes)
        })
      })
    })
  }
}

exports.server_restart = _method_builder(server_restart)
exports.automation_reload = _method_builder(automation_reload)
exports.script_reload = _method_builder(script_reload)
exports.scene_reload = _method_builder(scene_reload)
exports.themes = _method_builder(get_themes)
exports.panels = _method_builder(get_panels)
exports.states = _method_builder(get_states)
exports.services = _method_builder(get_services)
exports.persistent_notifications = _method_builder(get_persistent_notifications)
