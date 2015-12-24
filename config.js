var config = {
  db: "mongodb://localhost/db",
  uid: 1000,
  gid: 1000,

  // Socket name, remove this file before starting 
  socket: "./test.socket",
  home: "/home",

  // Prefix is used to mark off authentication, whether it comming from webmail or not
  prefixes : [
    "__webmail__",
  ]
}
module.exports = config;
