var test = require('tap').test
,db = require('../lib/db')
;










test('db can do stuffFFF!!! ',function(t){
  var nano = db();
  t.ok(nano,'should have a non from the call to db'); 

  nano.list(function(err,data){
    t.ok(!err,'should not have error from query');
    t.ok(data.rows,'shoudl have rows key in valid data response');
    t.end();
  })

});
