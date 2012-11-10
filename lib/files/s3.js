var fs = require('fs')
,path = require('path')
,knox = require('knox')
,mime = require('mime')
;

module.exports = function(config){
  if(!config) return cb('s3 config required');

  var o = {};

  o.client = knox.createClient({
    key:config.key
    ,secret:config.secret
    ,bucket:config.bucket
  });

  o.acl = 'public'; 
  o.upload = function(file,cb){
    var z = this;
    var type = mime.lookup(file);

    fs.stat(file,function(err,stat){
      if(err) return cb(err);

      var req = client.put('/'+path.basename(file),{'x-amz-acl':z.acl,'Content-Type':type,'Content-Length':stat.size});

      req.on('response',function(res){
        if(cb) cb(res.statusCode == 200?null:new Error('failed to upload'),res);
        cb = null;
      });

      req.on('error',function(e){
        if(cb) cb(e);
        cb = null;
      });

      fs.createReadStream(file).pipe(req);
    });
  };

  o.download = function(){

  }

  return o;
};
