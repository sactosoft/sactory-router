var fs = require("fs");
var Transpiler = require("sactory/transpiler");
var { minify } = require("uglify-js");

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

			var result = new Transpiler({filename, env: "define"}).transpile(source);
			var output = "!function(a){\n" +
				"	if(typeof define == \"function\" && define.amd) {\n" +
				"		define([\"sactory\", \"exports\"], a);\n" +
				"	} else {\n" +
				"		a(Sactory, window);\n" +
				"	}\n" +
				"}(function(Sactory, exports){\n\n" +
				"var " + result.variables.runtime + " = Sactory;\n" +
				"var " + result.variables.context + " = {};\n\n" + result.source.contentOnly + "\n});\n";
			fs.writeFile("./dist/" + filename.slice(0, -1), output, nop);

			var minname = filename.slice(0, -3) + "min.js";
			var mapname = minname + ".map";
			var minified = minify(output, {
				sourceMap: {
					filename: minname,
					url: mapname
				}
			});
			fs.writeFile("./dist/" + minname, minified.code, nop);
			fs.writeFile("./dist/" + mapname, minified.map, nop);

		});
	});
});
