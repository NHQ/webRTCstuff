#!/usr/bin/env node
var design = require('../lib/persist/designs');

design(function(err,data){
  if(err) throw err;
  console.log('designs ran successfully');
})
