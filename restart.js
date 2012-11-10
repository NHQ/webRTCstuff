var watch = require('watch');
var fork = require('child_process').fork;
var cp;

var exts = ['js','css','json','html'];

function add(){
  if(cp) return;
  cp = fork(__dirname+'/server.js');
  cp.on('exit',function(){
    cp = null;
    setTimeout(function(){
      add();
    },1000);
  })
}

watch.watchTree(__dirname,function(p){
  if(!cp) return;
  if(!p || !p.substr) return;
  var ext = p.split('.').pop();
  if(!~exts.indexOf(ext) && !~p.indexOf('server.js')) return;

  console.log('changed ',p)
  cp.kill('SIGKILL');
});

add();
