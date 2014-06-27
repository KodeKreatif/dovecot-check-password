var mongoose = require ("mongoose");
var schema = new mongoose.Schema({ 
  email: 'string', 
  hash: 'string', 
  created: 'Date',
  modified: 'Date',
  mailboxServer: "Number",
  quota: "Number"
});

try {
    User = mongoose.model ("User");
}
catch (err) {
    User = mongoose.model ("User", schema);
}

module.exports = User;
