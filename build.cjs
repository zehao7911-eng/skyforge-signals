const fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const code=['core.mjs','view.mjs','audio.mjs','sdk.mjs','game.mjs'].map(name=>read(name).replace(/^import .*?;\s*/gm,'').replace(/\bexport\s+/g,'')).join('\n');
const html=read('index-source.html')
 .replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+read('style.css')+'</style>')
 .replace('<script src="vendor/three.min.js"></script>',()=>'<script>'+read('vendor/three.min.js').replace(/<\/script/gi,'<\\/script')+'</script>')
 .replace('<script type="module" src="game.mjs"></script>',()=>'<script>(()=>{'+code+'})();</script>');
for(const name of ['index.html','standalone.html'])fs.writeFileSync(path.join(__dirname,name),html);
