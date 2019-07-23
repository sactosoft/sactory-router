var fs = require("fs");
var Transpiler = require("sactory/transpiler");

var nop = () => {};

// clear dist directory
fs.readdir("./dist/", (error, items) => {
	if(error) {
		// directory does not exist yet
		fs.mkdir("./dist/", nop);
	} else {
		items.forEach(item => fs.unlink("./dist/" + item, nop));
	}
});

// transpile files from src to dist
fs.readdir("./src/", (error, items) => {
	items.forEach(filename => {
		fs.readFile("./src/" + filename, "utf8", (error, source) => {

			!function(source){
				source = source.replace(/var Sactory = require\("sactory"\);/, "");
				source = source.replace(/\/\/export ([A-Za-z0-9_]+)/gm, "window.$1 = $1;");
				var none = new Transpiler({filename, env: "none"}).transpile(source);
				fs.writeFile("./dist/" + filename.slice(0, -1), "!function(){" + none.source.all + "}()", nop);
			}(source);

			!function(source){
				source = source.replace(/\/\/export ([A-Za-z0-9_]+)/gm, "exports.$1 = $1;");
				source = "var exports = {};" + source + "return exports;";
				var define = new Transpiler({filename, env: "define"}).transpile(source);
				fs.writeFile("./dist/" + filename.slice(0, -3) + "amd.js", define.source.all, nop);
			}(source);

		});
	});
});
