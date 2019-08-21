var gulp = require("gulp");
var { plugin } = require("@sactory/dev");

gulp.task("dist", plugin("router", ["Router"]));
