var config = require('./lib/config')
,app = require('./index.js')(config)

var port = config.port||process.env.PORT||8000;


app.listen(port,function(){
  console.log('server is listening. woooo! ',port);
});

