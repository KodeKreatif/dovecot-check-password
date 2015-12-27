#!/usr/bin/env node

var bcrypt = require ("nan-bcrypt");
var config = require("./config");
var mongoose = require ("mongoose");
var User = require("./schema").User;
var Domain = require("./schema").Domain;
var ssha = require("openldap_ssha");
var fs = require("fs");
var bsplit = require('buffer-split');

mongoose.connect(config.db);

var executable = process.argv[2];
var buffer = new Buffer(4096);
var fd = 0;

var fdInput = process.env.TESTFDIN || 3;
if (typeof(fdInput) === "string") {
  fdInput = parseInt(fdInput);
}
var fdOutput = process.env.TESTFDOUT || 4;
if (typeof(fdOutput) === "string") {
  fdOutput = parseInt(fdOutput);
}

var notAuthenticated = function () {
  if (fdOutput == process.env.TESTFDOUT) {
    console.log("not authenticated" );
  }
  process.exit(1);
}

var start = function(email, password) {
  var id = email.split("@");

  var username = id[0];
  for (var i in config.prefixes) {
    var r = new RegExp("^" + config.prefixes[i], "g");
    username = username.replace(r, "");
  }
  var domain = id[1];

  if (fdOutput == process.env.TESTFDOUT) {
    console.log("Checking", email);
  }

  if (!(username && domain)) {
    return notAuthenticated();
  }

  var domainQuery = Domain.findOne({name: domain});
  domainQuery.exec(function(e, domainResult) {
    if (!domainResult) {
      return notAuthenticated();
    }
    var task = User.findOne({
      username: username,
      domain: domainResult._id,
      state: "active"
    });
    task.exec(function(e, result) {
      var success = function(passOk) {
        if (!passOk) {
          notAuthenticated();
        }
        var arg = "";
        arg += "HOME=" + config.home + "/" + email + "\t";
        arg += "USER=" + username + "\t";

        var w = fs.createWriteStream(null, {fd: fdOutput});
        w.write(arg);
        w.end();
        process.exit(0);
      }

      if (result) {
        if (result.hash.indexOf("{SSHA}") == 0) {
          ssha.checkssha(password, result.hash, function(err, passOk) {
            success(passOk);
          });
        } else {
          var passOk = bcrypt.compareSync(password, result.hash);
          success(passOk);
        }
      } else {
        notAuthenticated();
      }
    });
  });
}

// http://wiki2.dovecot.org/AuthDatabase/CheckPassword
var s = fs.createReadStream(null, {fd:fdInput});
s.on("data", function(data) {
  var input = bsplit(data, new Buffer("\0"));
  if (input.length > 1) {
    var username = input[0].toString();
    for (var i in config.prefixes) {
      var r = new RegExp("^" + config.prefixes[i], "g");
      username = username.replace(r, "");
    }
    var password = input[1].toString();
    start(username, password);
  } else {
    process.exit(1);
  }
});
