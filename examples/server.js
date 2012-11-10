filed = require('filed');
server = require('http').createServer(function(req, res){
  filed('./ex.index.html').pipe(res);
}).listen(8001);
