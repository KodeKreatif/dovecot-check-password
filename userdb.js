#!/usr/bin/env node

var config = require("./config");
var mongoose = require ("mongoose");
var User = require("./schema").User;
var Domain = require("./schema").Domain;
var fs = require("fs");

mongoose.connect(config.db);

var start = function(email, cb) {
  var id = email.split("@");
  var username = id[0];
  for (var i in config.prefixes) {
    var r = new RegExp("^" + config.prefixes[i], "g");
    username = username.replace(r, "");
  }
  var domain = id[1];

  var domainQuery = Domain.findOne({name:domain});
  domainQuery.exec(function(e, domainResult) {
    var task = User.findOne({domain: domainResult._id, username:username, state: "active"});
    task.exec(function(e, result) {
      if (result) {
        var arg = {};
        arg.home = config.home + "/" + username;
        arg.uid = config.uid;
        arg.gid = config.gid;
        arg.user = username;
        arg.quota_rule = "*:storage=" + result.quota + "M";

        cb(arg);
      } else {
        return cb(null);
      }
    });
  });
}

var net = require("net");
var server = net.createServer(function(c) { 
  c.on("data", function(data) {
// Protocol is here: http://hg.dovecot.org/dovecot-2.2/file/tip/src/lib-dict/dict-client.h
var lines = data.toString().split("\n");
    for (var i = 0; i < lines.length; i ++) {

    if (lines[i][0] == "L") {
      var args = lines[i].split("/");
      start(args[args.length - 1], function(result) {
        if (result) {
          c.write("O" + JSON.stringify(result) + "\n");
        } else {
          c.write("N\n");
        }
      });
    }
    }
  });

  c.on("end", function() {
    console.log("server disconnected");
  });
  c.on("error", function(e) {
    console.log(e);
  });
});

server.listen(config.socket, function() {
  console.log("server bound");
});
