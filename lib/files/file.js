
var fs = require('fs');

module.exports = function(config){
  var o = {};

  o.upload = function(file,cb){
    fs.stat(file,function(err){
      if(err) return cb(err);
      var rs = fs.createReadStream(file)
      , target = config.path+"/"+path.basename(file)
      , tmpname = config.path+'/'+date.now()+'_'+path.basename(file)
      , ws = fs.createWriteStream(config.path+'/'+tmpname)
      ;

      rs.pipe(ws);
      rs.on('error',function(cb){
        fs.unlink(tmpname);
        cb(err);
      })

      rs.on('end',function(){
        fs.rename(tmpname,target,function(err,data){
          if(err) return cb(err);
        });
      })
    });
  }

  o.download = function(file){
    // wip
  }

}
