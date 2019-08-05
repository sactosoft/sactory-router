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

			var options = {
				filename,
				versionCheck: false,
				env: ["amd", "commonjs", "none"],
				globalExport: "Sactory." + filename.slice(0, -4),
				dependencies: {
					Sactory: {
						none: "Sactory",
						amd: "sactory",
						commonjs: "sactory"
					}
				}
			};
			var output = new Transpiler(options).transpile(source).source.all;
			fs.writeFile("./dist/sactory-" + filename.slice(0, -1), output, nop);

			var minname = filename.slice(0, -3) + "min.js";
			var mapname = minname + ".map";
			var minified = minify(output, {
				sourceMap: {
					filename: minname,
					url: mapname
				}
			});
			fs.writeFile("./dist/sactory-" + minname, minified.code, nop);
			fs.writeFile("./dist/sactory-" + mapname, minified.map, nop);

		});
	});
});
