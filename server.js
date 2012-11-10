var config = require('./lib/config')
,app = require('./index.js')(config)
;
var port = config.PORT||process.env.PORT||8000;

app.httpServer.listen(port,function(){
  console.log('server is listening. woooo! ',port);
});

