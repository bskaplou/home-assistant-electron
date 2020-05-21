exports.path = function (name, size = 16) {
  //strange @mdi/svg => HA miss sync
  if (name == "mdi:playstation") {
    name = "mdi:sony-playstation"
  }
  return (
    __dirname +
    "/images/" +
    name.replace(/\:/, "-") +
    "Template" +
    size +
    ".png"
  )
}
