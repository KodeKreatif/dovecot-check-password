var mongoose = require ("mongoose");
var Schema = mongoose.Schema;


var userSchema = new Schema({ 
  username: 'string', 
  domain: { type : Schema.Types.ObjectId},
  hash: 'string', 
  created: 'Date',
  modified: 'Date',
  mailboxServer: "Number",
  quota: "Number"
});

var domainSchema = new Schema({ 
  name: 'string', 
});

try {
    User = mongoose.model ("User");
}
catch (err) {
    User = mongoose.model ("User", userSchema);
}

try {
    Domain = mongoose.model ("Domain");
}
catch (err) {
    Domain = mongoose.model ("Domain", domainSchema);
}


module.exports = {
  User: User,
  Domain: Domain
};
