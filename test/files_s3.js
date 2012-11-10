var config = require('../lib/config')
, test = require('tap').test
, s3 = require('../lib/files/s3.js')
;


test("can use s3 lib",function(t){
  var o = s3(config.production.s3);
  t.ok(o,'should have object');
  o.client.list(function(err,data){
    t.ok(!err,'should not have error listing bucket');
    t.equals(config.production.s3.bucket,data.Name,'bucket name should be correct');
    t.end();
  });
});

