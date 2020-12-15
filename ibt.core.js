/*
@author kogen.cy
@author y.cycau@gmail.com
@see "https://github.com/kogen-cy/ibt"
@version 1.0
*/

(function (global) {

	var _CONF = {
		logicStart: "{{%", logicClose: "%}}",	// express logic  area, don't use RegExp meta character
		printStart: "{{#", printClose: "#}}",	// express output area, don't use RegExp meta character
		printStar2: "{{@", printClos2: "@}}",	// output with encode, don't use RegExp meta character
		modelName: "_m",
	}

	var _ENCODE = {
		"<": "&#60;", 
		">": "&#62;", 
		'"': "&#34;", 
		"'": "&#39;", 
		"/": "&#47;"
	};
	//not applicable type
	var _TYPECONTAINER = {
		"CAPTION": "table", 
		"THEAD": "table",
		"TFOOT": "table",
		"TBOODY": "table",
		"TR": "table",
		"COLGROUP": "table tr",
		"COL: ": "table tr",
		"TH": "table tr",
		"TD": "table tr",
		"LI": "ul",
		"DT": "dl",
		"DD": "dl",
		"OPTION": "select",
		"OPTGROUP": "select",
		"AREA": "map",
		"LEGEND": "fieldset",
	}
	
	var _CACHE = {html:{}, func:{}};
	/***
	 * support only if|for in _ibt attribute
	 * .etc
	 *  if (condition) continue | break
	 *  if (condition) xxx; yyy; zzz; => {xxx; yyy; zzz;
	 *  for(condition) xxx; yyy; zzz; => {xxx; yyy; zzz;
	 ***/
	var syntax = function(expr) {
		if (expr.match(/^if\(.*?\)\s+(continue|break)/)) {
			return {start: expr};
		}
		var m = expr.match(/^(if|for)\s*\(.*?\)\s*({?)/);
		if (m) {
			if (m[2]) {
				return {start: expr, close:"}"};
			} else {
				return {start: expr.replace(/(.+\(.*?\))/, "$1 {"), close:"}"};
			}
		}
		return "[error!] syntax: " + expr;
	}
	
	var buildParts = function(partsSelector) {
		for (var key in _CACHE.html) {
			var strHtml = _CACHE.html[key];
			var eleDiv = document.createElement("div");

			var m = strHtml.match(/^\s*<([\w\d]+)/);
			if (m) {
				var containerTag = _TYPECONTAINER[m[1].toUpperCase()] || "div";
				var tags = containerTag.split(" ");
				for (var idx in tags) {
					var container = document.createElement(tags[idx]);
					eleDiv.append(container);
					eleDiv = container;
				}
			}
			var regstr;
			regstr = "(<!\\-\\-\\s*)?(" + _CONF.logicStart + "|" + _CONF.printStart + "|" + _CONF.printStar2 + ")";
			strHtml = strHtml.replace(new RegExp(regstr, "g"), function (m, cmtStar, start) {return "<!-- " + start;})
			regstr = "(" + _CONF.logicClose + "|" + _CONF.printClose + "|" + _CONF.printClos2 + ")(\\s*\\-\\->)?";
			strHtml = strHtml.replace(new RegExp(regstr, "g"), function (m, close, cmtClose) {return close + " -->";})
			eleDiv.innerHTML = strHtml;

			var parts = eleDiv.querySelector(partsSelector);
			if (parts) {
				var partsFunc = this.build(this.prepare(parts.outerHTML));
				_CACHE.func[partsSelector] = partsFunc;
				return partsFunc;
			}
		}
		return function() {return "[error!] buildParts: not found target. " + selector;};
	}

	var urlStringify = function (url, queryMap) {
		if (!queryMap) return url;
		if (!Object.keys(queryMap).length) return url;

		return url + "?" + Object.keys(queryMap).map(function (key) {
			return key + "=" + encodeURIComponent(queryMap[key]);
		}).join("&");
	}

	/*********************************************************/
	function IsBoringTemplate() {}
	var fn = IsBoringTemplate.prototype;

	/*****
	 * HTTP request JSON
	 * 	 GET : default
	 * 	 POST: set paramMap to {_method:'POST'}
	 *****/
	fn.http = function(url, paramMap, onSuccess, onError) {
		var ibtInstance = this;
		var method = "GET";

		if (paramMap) {
			if (paramMap._method) {
				method = paramMap._method.toUpperCase();
				delete paramMap._method;
			}
			if (method == "GET") {
				url = urlStringify(url, paramMap);
				paramMap = null;
			}
		}
		var xhr = new XMLHttpRequest();
		xhr.onload = function() {
			var jsonResponse;
			try{
				jsonResponse = JSON.parse(xhr.response)
			}catch (e) {
				jsonResponse = {};
				jsonResponse.response = xhr.response;
			}
			JSON.parse(xhr.response);
			if (xhr.status == 200) {
				if (onSuccess) onSuccess.call(ibtInstance, jsonResponse, xhr.status);
				return;
			}
			if (onError) onError.call(ibtInstance, jsonResponse, xhr.status);
			console.log("[error!] http " + method + " " + url + " status[" + xhr.status + "]");
		}
		xhr.onerror = function() {
			if (onError) onError.call(ibtInstance, null, 0);
			console.log("[error!] http " + method + " " + url + " status[failed]");
		}
		xhr.open(method, url);
		xhr.setRequestHeader("Content-Type", "application/json");
		//xhr.responseType = 'json';
		xhr.send(method == "POST" ? JSON.stringify(queryMap) : null);
	}
	/*****
	 * external template(synchronized HTTP)
	 * @deprecated, use $.load() instead
	 *****/
	fn.exttpl = function(url, queryMap) {
		url = urlStringify(url, queryMap);
		if (_CACHE.html[url]) return _CACHE.html[url];

		var request = new XMLHttpRequest();
		request.open('GET', url, false);
		request.send(null);
		var strHtml;
		if (request.status === 200) {
			strHtml = request.responseText;
		} else {
			strHtml = "[error!] exttpl: " + url;
		}

		return _CACHE.html[url] = strHtml;
	}

	/*****
	 * encode output area
	 *****/
	fn.encode = function (strHtml) {
		strHtml = strHtml || '';
		strHtml = strHtml.replace(/[<>"'\/]/g, function (c) { 
			return _ENCODE[c]; 
		});
		return strHtml
	};

	/*****
	 * @deprecated (not for public use)
	 *****/
	fn.prepare = function(strHtml) {
		strHtml = strHtml.replace(/^\s+|\s+$/gm, "");
		var eleDiv = document.createElement("div");

		var m = strHtml.match(/^\s*<([\w\d]+)/);
		if (m) {
			var containerTag = _TYPECONTAINER[m[1].toUpperCase()] || "div";
			var tags = containerTag.split(" ");
			for (var idx in tags) {
				var container = document.createElement(tags[idx]);
				eleDiv.append(container);
				eleDiv = container;
			}
		}
		var regstr;
		regstr = "(<!\\-\\-\\s*)?(" + _CONF.logicStart + "|" + _CONF.printStart + "|" + _CONF.printStar2 + ")";
		strHtml = strHtml.replace(new RegExp(regstr, "g"), function (m, cmtStart, start) {return "<!-- " + start;})
		regstr = "(" + _CONF.logicClose + "|" + _CONF.printClose + "|" + _CONF.printClos2 + ")(\\s*\\-\\->)?";
		strHtml = strHtml.replace(new RegExp(regstr, "g"), function (m, close, cmtClose) {return close + " -->";})
		eleDiv.innerHTML = strHtml;

		var logic = {};
		var logicKey; var idx = 0; var prefix = "_ibtL0Gic"; 
		eleDiv.querySelectorAll("[_ibt]").forEach(function(element) {
			var expr = element.getAttribute("_ibt").trim();
			element.removeAttribute("_ibt");

			if (expr == "_DUMMY") {
				element.remove();
				return;
			}

			if (expr.startsWith("exttpl(")) {
				logicKey = prefix + ++idx + "E";
				//element.before(_CONF.printStart + " (this.build(this.prepare(this." + expr + "))).call(this, _m) " + _CONF.printClose);
				logic[logicKey] = _CONF.printStart + " (this.build(this.prepare(this." + expr + "))).call(this, _m) " + _CONF.printClose;
				element.before(logicKey);
				element.remove();
				return;
			}

			var block = syntax(expr);
			logicKey = prefix + ++idx + "E";
			//element.before(encodeURIComponent(_CONF.logicStart + " " + block.start + " " + _CONF.logicClose));
			logic[logicKey] = _CONF.logicStart + " " + block.start + " " + _CONF.logicClose;
			element.before(logicKey);

			if (block.close) {
				logicKey = prefix + ++idx + "E";
				//element.after(encodeURIComponent(_CONF.logicStart + " " + block.close + " " + _CONF.logicClose));
				logic[logicKey] = _CONF.logicStart + " " + block.close + " " + _CONF.logicClose;
				element.after(logicKey);
			}
		})

		strHtml = eleDiv.innerHTML;
		for (logicKey in logic) {
			strHtml = strHtml.replace(logicKey, "<!-- " + logic[logicKey] + " -->");
		}
		return strHtml;
	}

	/*****
	 * build HTML for output
	 * how to use: _ibt.duild(strHtml).call(_ibt, modelData)
	 *****/
	fn.build = function (strHtml) {
		var regstr;
		regstr  = "(<!\\-\\-\\s*)?";
		regstr += "(" + _CONF.logicStart + "|" + _CONF.printStart + "|" + _CONF.printStar2 + ")";
		regstr += "(.*?)";
		regstr += "(" + _CONF.logicClose + "|" + _CONF.printClose + "|" + _CONF.printClos2 + ")";
		regstr += "(\\s*\\-\\->)?";
		
		var tpl = strHtml.replace(/[\r\n]/g, " ")
			.replace(new RegExp(regstr, "g"), function (m, cmtStar, start, expr, close, cmtClose) {
				if (start === _CONF.logicStart && close === _CONF.logicClose) {
					return "'; " + expr + "; out+='";
				}
				if (start === _CONF.printStart && close === _CONF.printClose) {
					return "' + (" + expr + ") + '";
				}
				if (start === _CONF.printStar2 && close === _CONF.printClos2) {
					return "' + this.encode(" + expr + ") + '";
				}

				return "' + ('[error!] build. " + m + "') + '";
			});

		tpl = "var out=''; out+='" + tpl + "'; return out;";

		return new Function(_CONF.modelName, tpl);
	};

	/*****
	 * run first to define template(s)
	 *****/
	fn.buildTpl = function(tplSelector) {
		tplSelector = tplSelector || "body";
		var tpl = document.querySelector(tplSelector);

		var strHtml = tpl.innerHTML;
		_CACHE.html[tplSelector] = strHtml;
		_CACHE.func[tplSelector] = this.build(this.prepare(strHtml));
		//tpl.innerHTML = '';
	}
	/*****
	 * replace inner contents
	 *****/
	fn.reflect = function(modelData, tplSelector, tarSelector) {
		tplSelector = tplSelector || 'body';
		var tplFunc = _CACHE.func[tplSelector] || buildParts.call(this, tplSelector);
		var element = document.querySelector(tarSelector || tplSelector)
		if (element) element.innerHTML = tplFunc.call(this, modelData);
		else console.log("[error!] reflect: target not exists. " + (tarSelector || tplSelector));
	}
	/*****
	 * prepend to inner contents
	 *****/
	fn.prepend = function(modelData, tplSelector, tarSelector) {
		tplSelector = tplSelector || 'body';
		var tplFunc = _CACHE.func[tplSelector] || buildParts.call(this, tplSelector);
		var element = document.querySelector(tarSelector || tplSelector);
		if (element) element.insertAdjacentHTML('afterbegin', tplFunc.call(this, modelData));
		else console.log("[error!] prepend: target not exists. " + (tarSelector || tplSelector));
	}
	/*****
	 * append to inner contents
	 *****/
	fn.append = function(modelData, tplSelector, tarSelector) {
		tplSelector = tplSelector || 'body';
		var tplFunc = _CACHE.func[tplSelector] || buildParts.call(this, tplSelector);
		var element = document.querySelector(tarSelector || tplSelector);
		if (element) element.insertAdjacentHTML('beforeend', tplFunc.call(this, modelData));
		else console.log("[error!] append: target not exists. " + (tarSelector || tplSelector));
	}
	/*****
	 * remove target
	 *****/
	fn.remove = function(tarSelector) {
		var element = document.querySelector(tarSelector);
		if (element) element.remove();
		else console.log("[error!] remove: target not exists. " + tarSelector);
	}
	/*****
	 * request HTTP & replace inner contents
	 *****/
	fn.httpReflect = function(urlStr, paramMap, tplSelector, tarSelector, dataProcess, dataProcessOnErr) {
		var onSuccess = function(jsonResponse) {
			if (dataProcess) jsonResponse = dataProcess(jsonResponse);
			this.reflect(jsonResponse, tplSelector, tarSelector);
		}
		var onError = function(status, jsonResponse) {
			if (dataProcessOnErr) jsonResponse = dataProcessOnErr(jsonResponse, status);
		}
		this.http(urlStr, paramMap, onSuccess, onError);
	}
	/*****
	 * request HTTP & prepend to inner contents
	 *****/
	fn.httpPrepend = function(urlStr, paramMap, tplSelector, tarSelector, dataProcess, dataProcessOnErr) {
		var onSuccess = function(jsonResponse) {
			if (dataProcess) jsonResponse = dataProcess(jsonResponse);
			this.prepend(jsonResponse, tplSelector, tarSelector);
		}
		var onError = function(status, jsonResponse) {
			if (dataProcessOnErr) jsonResponse = dataProcessOnErr(jsonResponse, status);
		}
		this.http(urlStr, paramMap, onSuccess, onError);
	}
	/*****
	 * request HTTP & append to inner contents
	 *****/
	fn.httpAppend = function(urlStr, paramMap, tplSelector, tarSelector, dataProcess, dataProcessOnErr) {
		var onSuccess = function(jsonResponse) {
			if (dataProcess) jsonResponse = dataProcess(jsonResponse);
			this.append(jsonResponse, tplSelector, tarSelector);
		}
		var onError = function(status, jsonResponse) {
			if (dataProcessOnErr) jsonResponse = dataProcessOnErr(jsonResponse, status);
		}
		this.http(urlStr, paramMap, onSuccess, onError);
	}
	/*****
	 * request HTTP & remove target
	 *****/
	fn.httpRemove = function(urlStr, paramMap, tarSelector, dataProcess, dataProcessOnErr) {
		var onSuccess = function(jsonResponse) {
			if (dataProcess) jsonResponse = dataProcess(jsonResponse);
			this.remove(tarSelector);
		}
		var onError = function(status, jsonResponse) {
			if (dataProcessOnErr) jsonResponse = dataProcessOnErr(jsonResponse, status);
		}
		this.http(urlStr, paramMap, onSuccess, onError);
	}
	/*****
	 * show | off body 
	 *****/
	fn.showPage = function(visible) {
		var body = document.querySelector("body");
		if (body) {
			if (visible === false) {
				body.style.visibility = "hidden";
				return;
			}
			body.style.visibility = "visible";
		}
	}

	/*****
	 * publish
	 *****/
	var _ibt = new IsBoringTemplate();
	// CommonJS
	if (typeof exports === 'object' && typeof module !== 'undefined') { 
		module.exports = _ibt;
	// AMD
	} else if (typeof define === 'function') { 
		define(function () { return _ibt; });
	// WINDOWS
	} else {
		global._ibt = _ibt;
	}

	switch (document.readyState) {
		case "loading":
			document.addEventListener('DOMContentLoaded', function () {
				_ibt.showPage(false);
				if (typeof _ibtRun === 'function') _ibtRun();
				_ibt.showPage(true);
			});
			break;
		default : // interactive, complete
			_ibt.showPage(false);
			if (typeof _ibtRun === 'function') {_ibtRun(); _ibt.showPage(true); break;}
			window.addEventListener("load", function () {
				if (typeof _ibtRun === 'function') _ibtRun();
				_ibt.showPage(true);
			});
			break;
	}
})(this);
