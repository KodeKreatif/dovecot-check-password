#!/usr/bin/env node

var config = require("./config");
var mongoose = require ("mongoose");
var User = require("./schema");
var ssha = require("openldap_ssha");
var fs = require("fs");
var bsplit = require('buffer-split');

mongoose.connect(config.db);

var executable = process.argv[2];
var buffer = new Buffer(4096);
var fd = 0;

var notAuthenticated = function () {
  process.exit(1);
}

var start = function(username, password) {
  var task = User.findOne({email:username});
  task.exec(function(e, result) {
    if (result) {
      ssha.checkssha(password, result.hash, function(err, passOk) {
        if (!passOk) {
          notAuthenticated();
        }
        var arg = "";
        arg += "HOME=" + config.home + "/" + username + "\t";
        arg += "USER=" + username + "\t";

        var w = fs.createWriteStream(null, {fd: 4});
        w.write(arg);
        w.end();
        process.exit(0);
      });
    } else {
      notAuthenticated();
    }
  });
}

// http://wiki2.dovecot.org/AuthDatabase/CheckPassword
var s = fs.createReadStream(null, {fd:3});
s.on("data", function(data) {
  var input = bsplit(data, new Buffer("\0"));
  if (input.length > 1) {
    var username = input[0].toString();
    var password = input[1].toString();
    start(username, password);
  } else {
    process.exit(1);
  }
});
