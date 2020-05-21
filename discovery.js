const bonjour = require("bonjour")()
const http = require("http")

let discovery_callbacks = []
let discovery_found = []

bonjour.find({ type: "home-assistant" }, function (service) {
  if (service.hasOwnProperty("txt") && service.txt.hasOwnProperty("base_url")) {
    url = service.txt.base_url
    if (!discovery_found.includes(url)) {
      discovery_found.push(url)
    }
  } else {
    for (host of service.addresses) {
      url_http = "http://" + host + ":" + service.port
      url_https = "https://" + host + ":" + service.port
      if (!discovery_found.includes(url_http)) {
        discovery_found.push(url_http)
      }
      if (!discovery_found.includes(url_https)) {
        discovery_found.push(url_https)
      }
    }
  }
  discovery_deliver()
})

function discovery_deliver() {
  if (discovery_callbacks.length > 0 && discovery_found.length > 0) {
    for (callback of discovery_callbacks) {
      callback(discovery_found)
    }
  }
}

exports.find = function (callback) {
  discovery_callbacks.push(callback)
  discovery_deliver()
}
