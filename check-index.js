var config = require("./config");
var spawn = require("child_process").spawn;

var server = spawn("node", [ "./index.js" ], { env: { TESTFDIN: 0, TESTFDOUT: 1} });
server.stdout.on("data", function(data) {
  console.log("O: ", data.toString());
});
server.stderr.on("data", function(data) {
  console.log("E: ", data.toString());
});

server.on("close", function() {
  console.log("donw");
});
server.stdin.write("account@pnsmail.go.id\0password\0");
server.stdin.end();
console.log("waiting");

