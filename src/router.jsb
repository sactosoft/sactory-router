var Sactory = require("sactory");

function Router(path, anchor, options) {

	// transform to absolute path
	this.path = <a href=path />.href;
	this.bind = Sactory.bindFactory.fork();
	this.anchor = anchor;
	this.options = options || {};
	this.routes = [];

	if(this.path.charAt(this.path.length - 1) != "/") this.path += "/";
	if(!this.options.routes) this.options.routes = "";
	else if(this.options.routes.charAt(this.options.routes.length - 1) != "/") this.options.routes += "/";

	var router = this;

	Sactory.addWidget("a", function@(){
		return <["a"] +click={ router.handleAnchor(event, this) } />
	});

	// also handle the links created before or without sactory
	<"a"+ :query-body +click:this=this.handleAnchor />

	// handle popstate event
	window.onpopstate = function(){
		router.reload();
	};

}

Router.prototype.handleAnchor = function(event, anchor){
	if(!anchor.target || anchor.target == "_self") {
		//TODO check path matching
		event.preventDefault();
		this.go(anchor.href);
	}
};

Router.prototype.handle = function(handler, params){
	handler(null, this.anchor.parentNode, this.bind, this.anchor, params);
};

Router.prototype.route = function(path, handler){
	if(path instanceof Array) {
		for(var i=0; i<path.length; i++) {
			this.routeImpl(path[i], handler);
		}
	} else {
		this.routeImpl(path, handler);
	}
};

Router.prototype.routeImpl = function(path, handler){
	var route = {parts: []};
	path.split("/").forEach(function(part){
		if(part.charAt(0) == ":") {
			route.parts.push({variable: true, name: part.substr(1)});
		} else {
			route.parts.push({path: part});
		}
	});
	if(typeof handler != "function") {
		var router = this;
		var lib = this.options.routes + (typeof handler == "string" ? handler : (function(){
			var ret = [];
			for(var i=0; i<route.parts.length; i++) {
				var part = route.parts[i];
				if(part.variable) break;
				else ret.push(part.path);
			}
			return ret.join("/");
		})());
		route.handler = function(_, element, bind, anchor, params){
			require([lib], function(handler){
				handler(_, element, bind, anchor, params);
				if(router.after) router.after();
			});
		};
		route.async = true;
	} else {
		route.handler = handler;
	}
	this.routes.push(route);
};

Router.prototype.redirect = function(from, to){
	var router = this;
	if(typeof to == "function") {
		this.route(from, function(_, element, bind, anchor, params){
			router.redirectImpl(to(params));
		});
	} else {
		this.route(from, function(){
			router.redirectImpl(to);
		});
	}
};

Router.prototype.redirectImpl = function(path){
	window.history.replaceState("", {}, path + (path.indexOf("?") == -1 ? window.location.search : (window.location.search && "&" + window.location.search.substr(1))) + window.location.hash);
	router.reload();
};

Router.prototype.notFound = function(handler){
	this.routes.notFound = handler;
};

Router.prototype.go = function(path){
	window.history.pushState("", {}, path);
	this.reload();
};

Router.prototype.reload = function(){
	this.bind.rollback(); // undo changes
	if(this.before) this.before();
	var path = (window.location.protocol + "//" + window.location.host + window.location.pathname).substr(this.path.length).split("/");
	for(var i=0; i<this.routes.length; i++) {
		var route = this.routes[i];
		if(route.parts.length == path.length) {
			var match = true;
			var params = [];
			for(var j=0; j<path.length; j++) {
				var part = route.parts[j];
				var value = path[j];
				if(part.variable) {
					params.push(params[part.name] = decodeURIComponent(value));
				} else if(part.path != value) {
					match = false;
					break;
				}
			}
			if(match) {
				params.query = {};
				if(window.location.search) {
					window.location.search.substr(1).split("&").forEach(function(pair){
						var eq = pair.indexOf("=");
						var key, value = "";
						if(eq > 0) {
							key = pair.substring(0, eq);
							value = decodeURIComponent(pair.substr(eq + 1).replace(/\+/g, " "));
						} else {
							key = pair;
						}
						key = decodeURIComponent(key);
						if(params.query.hasOwnProperty(key)) {
							// concat with other values
							params.query[key] = [].concat(params.query[key], value);
						} else {
							params.query[key] = value;
						}
					});
				}
				this.handle(route.handler, params);
				if(!route.async && this.after) this.after();
				return;
			}
		}
	}
	if(this.routes.notFound) {
		this.handle(this.routes.notFound);
		if(this.after) this.after();
	}
};

//export Router
