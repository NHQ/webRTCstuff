var config = require('confuse')({files:['config.json','localconfig.json']});

var env = 'dev';
if(process.env.NODE_ENV && config[process.env.NODE_ENV]) {
  env = process.env.NODE_ENV;
}

config.env = config[env];

module.exports = config;

