var instance;

function Language(dict, version) {
	this.dict = dict;
	this.locale = @watch(this.getDefaultLocale(), "sactory.lang.locale" + (version || ""));
	instance = this;
}

Language.prototype.getDefaultLocale = function(){
	var langs = this.languages.map(function(lang){
		var cased = lang.toLowerCase();
		var sep = cased.indexOf("-");
		if(sep == -1) {
			return {lang: lang, code: cased};
		} else {
			return {lang: lang, code: cased.substring(0, sep), country: cased.substr(sep + 1)};
		}
	});
	for(var i=0; i<window.navigator.languages; i++) {
		var nl = window.navigator.languages[i].toLowerCase();
		var sep = nl.indexOf("-");
		var code = sep == -1 ? nl : nl.substring(0, sep);
		var country = sep != -1 && nl.substr(sep + 1);
		for(var j=0; j<langs.length; j++) {
			var lang = langs[j];
			if(code == lang.code && (!lang.country || country == lang.country)) return lang.lang;
		}
	}
	return langs[0].lang;
};

Object.defineProperty(Language.prototype, "languages", {
	get: function(){
		return Object.keys(this.dict);
	}
});

Language.prototype.get = function(key, args, lang){
	var ret = this.dict[lang || this.^locale][key];
	if(ret) {
		if(args) {
			for(var key in args) {
				ret = ret.replace("{" + key + "}", args[key]);
			}
		}
		return ret;
	} else {
		return "??" + key + "??";
	}
};

Sactory.addWidget("lang", function(@, attrs){

	if(!@@) @@ = <:fragment />;

	if(typeof attrs == "string") attrs = {text: attrs};

	var args = attrs.args;
	delete attrs.args;

	Object.keys(attrs).forEach(function(name){

		var deps = [instance.locale];
		if(args) {
			for(var name in args) {
				var arg = args[name];
				if(Sactory.isObservable(arg)) {
					deps.push(arg);
				}
			}
		}
		var value = @watch.deps(instance.get(attrs[name], args), deps);

		if(name == "text" || name == "html") {
			<@ ~[name]=value />
		} else {
			<@ [name]=value />
		}

	});

	return @@;

});

exports.Language = Language;
