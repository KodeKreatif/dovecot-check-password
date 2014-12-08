var config = require("./config");
var net = require("net");

var start = function() {
  this.write("H\n");
  this.write("L/a.abdullah@pnsmail.go.id\n");
}

var data = function(data) {
  console.log(data.toString());
}

var conn = net.createConnection(config.socket);
conn.on("connect", start);
conn.on("data", data);
