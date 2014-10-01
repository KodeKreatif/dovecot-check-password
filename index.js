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

var notAuthenticated = function () {
  process.exit(1);
}

var start = function(email, password) {
  var id = email.split("@");

  var username = id[0];
  var domain = id[1];

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
      domain: domainResult._id
    });
    task.exec(function(e, result) {
      var success = function(passOk) {
        if (!passOk) {
          notAuthenticated();
        }
        var arg = "";
        arg += "HOME=" + config.home + "/" + email + "\t";
        arg += "USER=" + username + "\t";

        var w = fs.createWriteStream(null, {fd: 4});
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
