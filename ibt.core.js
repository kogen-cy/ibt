/*
@author kogen.cy
@author y.cycau@gmail.com
@see "https://github.com/kogen-cy/ibt"
@version 2.9
*/

function IsBoringTemplate(element) {
	this.rootElement = element;
	this.model = {};
}

(function (global) {
	
	var _CONF = {
		logicStart: "{{%", logicClose: "}}",	// express logic  area, don't use RegExp meta character
		printStart: "{{#", printClose: "}}",	// express output area, don't use RegExp meta character
		printStar2: "{{@", printClos2: "}}",	// output with encode, don't use RegExp meta character
		modelPrefix: "_m",
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
		"TBODY": "table",
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
	};

	var _CACHE = {html:{}, func:{}};
	var _PREV_DATA = null;

	/***
	 * htmlのバックアップ
	 * document(main画面)
	 * external html
	 */
	var normalizeHtml = function(strHtml) {
		
		var RegStart = new RegExp("(<!\\-\\-\\s*)?(" + _CONF.logicStart + "|" + _CONF.printStart + "|" + _CONF.printStar2 + ")", "g");
		var RegClose = new RegExp("(" + _CONF.logicClose + "|" + _CONF.printClose + "|" + _CONF.printClos2 + ")(\\s*\\-\\->)?", "g");

		strHtml = strHtml.replace(/^\s+|\s+$/gm, ""); // 前後スペース
		strHtml = strHtml.replace(RegStart, function (m, cmtStart, start) {return "<!-- " + start;}) // ロジック開始前に<!--を入れる
		strHtml = strHtml.replace(RegClose, function (m, close, cmtClose) {return close + " -->";}) // ロジック終了後に-->を入れる

		return strHtml;
	}

	/***
	 * support only if|for in _ibt attribute
	 * .etc
	 *  if (condition) continue | break
	 *  if (condition) xxx; yyy; zzz; => if (condition) {xxx; yyy; zzz;
	 *  for(condition) xxx; yyy; zzz; => for(condition) {xxx; yyy; zzz;
	 ***/
	var syntaxAnalyze = function(expr) {
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
		return "[error!] syntaxAnalyze: " + expr;
	}
	/*****
	 * external template(synchronized HTTP)
	 * @deprecated, use $.load() instead
	 *****/
	exttpl = function(url, queryMap) {
		url = this.urlStringify(url, queryMap);
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
	var prepare = function(strHtml) {
		strHtml = normalizeHtml(strHtml)

		var eleDiv = document.createElement("div");
		eleDiv.innerHTML = strHtml;

		var logic = {};
		var logicKey; var idx = 0; var prefix = "_ibtL0Gic"; 
		eleDiv.querySelectorAll("[_ibt]").forEach(function(element) {
			var expr = element.getAttribute("_ibt").trim();

			if (expr == "_DUMMY") {
				element.remove();
				return;
			}

			//if (expr.indexOf('(') < 0) return; // model用のプロパティはそのまま残す

			element.removeAttribute("_ibt");
			if (expr.startsWith("exttpl(")) {
				logicKey = prefix + ++idx + "E";
				//element.before(_CONF.printStart + " (build(" + expr + ")).call(this, _m) " + _CONF.printClose);
				logic[logicKey] = _CONF.printStart + " (build(" + expr + ")).call(this, _m) " + _CONF.printClose;
				element.before(logicKey);
				element.remove();
				return;
			}

			var block = syntaxAnalyze(expr);
			if (block.start) {
				logicKey = prefix + ++idx + "E";
				//element.before(encodeURIComponent(_CONF.logicStart + " " + block.start + " " + _CONF.logicClose));
				logic[logicKey] = _CONF.logicStart + " " + block.start + " " + _CONF.logicClose;
				element.before(logicKey);
			}

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
	 *****/
	build = function (strHtml) {
		strHtml = prepare(strHtml);

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

		return new Function(_CONF.modelPrefix, tpl);
		//divTmp.firstChild.innerHTML;
	};

	var buildTpl = function(selector) {
		if (_CACHE.func[selector]) return _CACHE.func[selector];

		if (!_CACHE.html[0] && document.body) {
			_CACHE.html[0] = document.body.innerHTML;
		}

		var tplFunc;
		for (var key in _CACHE.html) {
			var strHtml = _CACHE.html[key];
			var eleHtml = document.createElement("div");

			var m = strHtml.match(/^\s*<([\w\d]+)/); // 必要に応じてラッピングする。<tr>,<td> .etc
			if (m) {
				var containerTag = _TYPECONTAINER[m[1].toUpperCase()] || "div";
				var tags = containerTag.split(" ");
				for (var idx in tags) {
					var container = document.createElement(tags[idx]);
					eleHtml.append(container);
					eleHtml = container;
				}
			}

			eleHtml.innerHTML = strHtml;
			var eleTpl = eleHtml.querySelectorAll(selector);
			if (eleTpl.length < 1) console.error("not found template area with selector [" + selector + "]");
			if (eleTpl.length > 2) console.error("only one template area is allowed, but there is " + eleTpl.length + " with selector[" + selector + "]");
			if (eleTpl[0].hasAttribute("_ibt")) console.error("can't specify attribute [_ibt] in root element.");
			if (eleTpl) {tplFunc = build(eleTpl[0].outerHTML); break;}
		}
		
		if (!tplFunc) tplFunc = function() {return "[error!] buildTpl: not found target. " + selector;};

		return _CACHE.func[selector] = tplFunc;
	}

	var selectElement = function(selector) {
		return this.querySelector(selector);
	}
	var selectElements = function(selector) {
		return this.querySelectorAll(selector);
	}
	/*****
	 * priority 0:[valAttr] 30:value 40:innerHTML
	 *****/
	var valGetSet = function(valAttr, data) {
		if (typeof data !== 'undefined') {
			if (valAttr) {this.setAttribute(valAttr, data); return this;}
			if (typeof this.value !== 'undefined') {this.value = data; return this;}

			this.innerHTML = data;
			return this;
		}

		if (valAttr) return this.getAttribute(valAttr);
		if (typeof this.value !== 'undefined') return this.value;

		return this.innerHTML;
	}

	/*****
	 * return map values
	 * keyAttr default _ibtK
	 * keyAttr format "mapKey1.listKey2[].listKey3[n].[m].key4 ..."
	 * valAttr priority 0:[valAttr] 10:[_ibtV] 20:[[_ibtVa]] 30:value 40:innerHTML
	 *****/
	var extractModel = function (srcModel) {
		var initArray = {};
		var elements = this.querySelectorAll("[_ibt]");
		for (var idxEle=0; idxEle<elements.length; idxEle++) {
			var ele = elements[idxEle];
			var accessKey = (ele.getAttribute('_ibm').replaceAll(" ", "")+',').split(',');

			var keys = splitKey(accessKey[0]);
			var tc = tarContainer(srcModel, keys, initArray);
			tc[keys[keys.length-1]] = ele.val(accessKey[1]);
		}

		return srcModel;
	}
	var splitKey = function(accessKey) {
		if (typeof accessKey === 'undefined') return [];
		return accessKey.trim().replaceAll("[", ".[").replaceAll("..", ".").split(".");
	}
	var tarValue = function(currContainer, keys, cursor) {
		var fullKey = "R";
		var maxIdx = keys.length - 1;
		for (var idx=0; idx<=maxIdx; idx++) {
			var key = keys[idx];
			
			/*** current container is a MAP ***/
			if (!key.endsWith("]")) {
				if (!(currContainer instanceof Object)) error("not a MAP. " + fullKey);

				if (idx == maxIdx) return currContainer[key];

				fullKey += "." + key;
				if (!(key in currContainer)) console.error("container not found. " + fullKey);
				currContainer = currContainer[key];
				continue;
			}

			/*** current container is a Array ***/
			if (!(currContainer instanceof Array)) error("not a LIST. " + fullKey);

			/*** [], [+], [n], [<n] ***/
			var strIdx = key.substring(1, key.length-1);

			if (strIdx == ""){
				if (idx==maxIdx) {
					if (!(fullKey in cursor)) cursor[fullKey] = -1;
					cursor[fullKey] += 1;
					if (currContainer.length > cursor[fullKey]) {
						return currContainer[cursor[fullKey]];
					}
					error("out of bounds. " + fullKey + "[" + cursor[fullKey] + "]");
				}

				if (currContainer.length <1) return error("must have at least one element. " + fullKey);
				
				if (!(fullKey in cursor)) cursor[fullKey] = 0;
				if (currContainer.length > cursor[fullKey]) {
					currContainer = currContainer[cursor[fullKey]];
					fullKey += "[" + cursor[fullKey] + "]";
					continue;
				}
				error("out of bounds. " + fullKey + "[" + cursor[fullKey] + "]");
			}

			if(strIdx == "+"){
				if (idx==maxIdx) {
					if (!(fullKey in cursor)) cursor[fullKey] = -1;
					cursor[fullKey] += 1;
					if (currContainer.length > cursor[fullKey]) {
						return currContainer[cursor[fullKey]];
					}
					error("out of bounds. " + fullKey + "[" + cursor[fullKey] + "]");
				}
				
				if (!(fullKey in cursor)) cursor[fullKey] = -1;
				cursor[fullKey] += 1;
				if (currContainer.length > cursor[fullKey]) {
					currContainer = currContainer[cursor[fullKey]];
					fullKey += "[" + cursor[fullKey] + "]";
					continue;
				}
				error("out of bounds. " + fullKey + "[" + cursor[fullKey] + "]");
			}

			if(strIdx.startsWith("<")) 	{
				error("not supported syntax. " + fullKey + "[" + strIdx + "]");
			}

			var numIdx  = parseInt(strIdx);
			if (idx==maxIdx) {
				if (currContainer.length > numIdx) {
					return currContainer[numIdx];
				}
				error("out of bounds. " + fullKey + "[" + strIdx + "]");
			}

			if (currContainer.length > numIdx) {
				currContainer = currContainer[numIdx];
				fullKey += "[" + numIdx + "]";
				continue;
			}
			error("out of bounds. " + fullKey + "[" + strIdx + "]");
		}
		return currContainer;
	}
	var tarContainer = function(currContainer, keys, initArray) {
		var fullKey = "R";
		var maxIdx = keys.length - 1;
		for (var idx=0; idx<=maxIdx; idx++) {
			var key = keys[idx];
			
			/*** current container is a MAP ***/
			if (!key.endsWith("]")) {
				if (!(currContainer instanceof Object)) error("not a MAP. " + fullKey);

				if (idx == maxIdx) return currContainer;

				if (!currContainer[key]) {
					if (keys[idx+1].startsWith("[")) {
						currContainer[key] = [];
					} else {
						currContainer[key] = {};
					}
				}
				currContainer = currContainer[key];
				fullKey += "." + key;
				continue;
			}

			/*** current container is a Array ***/
			if (!(currContainer instanceof Array)) error("not a LIST. " + fullKey);

			/*** [], [+], [n], [<n] ***/
			var strIdx = key.substring(1, key.length-1);

			if (strIdx == ""){
				if (idx==maxIdx) {
					if (initArray) {
						if (!(fullKey in initArray)) {
							initArray[fullKey] = 1;
							currContainer.splice(0);
						}
					}

					keys[idx] = currContainer.length;
					currContainer.push(null);
					return currContainer;
				}

				if (currContainer.length <1) return error("must have at least one element. " + fullKey);
				
				if (initArray) {
					if (!(fullKey in initArray)) {
						initArray[fullKey] = 1;
						currContainer.splice(0);
						if (keys[idx+1].startsWith("[")) {
							currContainer.push([]);
						} else {
							currContainer.push({});
						}
					}
				}

				currContainer = currContainer[currContainer.length-1];
				fullKey += "[" + (currContainer.length-1) + "]";
				continue;
			}

			if(strIdx == "+"){
				if (idx==maxIdx) {
					if (initArray) {
						if (!(fullKey in initArray)) {
							initArray[fullKey] = 1;
							currContainer.splice(0);
						}
					}

					keys[idx] = currContainer.length;
					currContainer.push(null);
					return currContainer;
				}
				
				if (initArray) {
					if (!(fullKey in initArray)) {
						initArray[fullKey] = 1;
						currContainer.splice(0);
					}
				}

				if (keys[idx+1].startsWith("[")) {
					currContainer.push([]);
				} else {
					currContainer.push({});
				}
				currContainer = currContainer[currContainer.length-1];
				fullKey += "[" + (currContainer.length-1) + "]";
				continue;
			}

			if(strIdx.startsWith("<")) 	{
				var numIdx = parseInt(strIdx.substring(1) || "0");
				if (idx==maxIdx) {
					for (var listIdx=currContainer.length-1; listIdx<numIdx-1; listIdx++) currContainer.push(null);
					currContainer.splice(numIdx, 0, null);
					keys[idx] = numIdx;
					return currContainer;
				}

				fullKey += "[" + numIdx + "]";
				if (keys[idx+1].startsWith("[")) {
					for (var listIdx=currContainer.length-1; listIdx<numIdx-1; listIdx++) currContainer.push([]);
					currContainer.splice(numIdx, 0, []);
				} else {
					for (var listIdx=currContainer.length-1; listIdx<numIdx-1; listIdx++) currContainer.push({});
					currContainer.splice(numIdx, 0, {});
				}
				currContainer = currContainer[numIdx];
				continue;
			}

			var numIdx  = parseInt(strIdx);
			if (idx==maxIdx) {
				for (var listIdx=currContainer.length-1; listIdx<numIdx; listIdx++) currContainer.push(null);
				keys[idx] = numIdx;
				return currContainer;
			}

			fullKey += "[" + numIdx + "]";
			if (keys[idx+1].startsWith("[")) {
				for (var listIdx=currContainer.length-1; listIdx<numIdx; listIdx++) currContainer.push([]);
			} else {
				for (var listIdx=currContainer.length-1; listIdx<numIdx; listIdx++) currContainer.push({});
			}
			currContainer = currContainer[numIdx];
		}
		return currContainer;
	}
	/*************************************************/
	Element.prototype.s = selectElement;
	Element.prototype.S = selectElements;
	Element.prototype.val = valGetSet;
	Element.prototype.classes = function () { return this.classList; };
	//Element.prototype.m = function () { return extractModel.call(this, {}); };
	/*************************************************/

	/*************************************************/
	var fn = IsBoringTemplate.prototype;
	/*************************************************/
	fn.conf = {};
	fn.s = function (selector) {
		return selectElement.call(this.rootElement, selector);
	}
	fn.S = function (selector) {
		return selectElements.call(this.rootElement, selector);
	}
	fn.m = function (accessKey, data) {
		extractModel.call(this.rootElement, this.model);
		if (typeof accessKey === 'undefined') {
			return this.model;
		}
		var keys = splitKey(accessKey);
		if (typeof data !== 'undefined') {
			var tc = tarContainer(this.model, keys);
			tc[keys[keys.length-1]] = data;
			return this;
		}
		return tarValue(this.model, keys);
	}
	fn.encode = function (strHtml) {
		strHtml = strHtml + '';
		strHtml = strHtml.replace(/[<>"'\/]/g, function (c) { 
			return _ENCODE[c]; 
		});
		return strHtml
	};
	fn.urlStringify = function (url, queryMap) {
		if (!queryMap) return url;
		if (!Object.keys(queryMap).length) return url;

		return url + "?" + Object.keys(queryMap).map(function (key) {
			return key + "=" + encodeURIComponent(queryMap[key]);
		}).join("&");
	}
	/*****
	 * HTTP request
	 * 	 default : GET JSON
	 * 	 you can set paramMap to {_method:'POST', _responseType:'TEXT'}
	 *****/
	fn.api = function(url, paramMap, onSuccess, onError) {
		processing();

		var ibtInstance = this;
		var method = "GET";
		var responseType = "JSON";

		url = (this.conf.apientry || "") + url;
		if (paramMap) {
			if (paramMap._method) {
				method = paramMap._method.toUpperCase();
				delete paramMap._method;
			}
			if (paramMap._responseType) {
				responseType = paramMap._responseType.toUpperCase();
				delete paramMap._responseType;
			}
			if (method == "GET") {
				url = this.urlStringify(url, paramMap);
				paramMap = null;
			}
		}
		var xhr = new XMLHttpRequest();
		xhr.onload = function() {
			var response;
			try{
				if (responseType == "JSON") {
					response = JSON.parse(xhr.responseText);
				} else {
					response = xhr.responseText;
				}
			}catch (e) {
				if (responseType == "JSON") {
					response = {_exception: 1};
					response.response = xhr.responseText;
				} else {
					response = "ERROR!";
				}
			}
			if (xhr.status == 200) {
				if (onSuccess) onSuccess.call(ibtInstance, response, xhr.status);
			} else {
				if (onError) onError.call(ibtInstance, response, xhr.status);
				error("http: " + method + " " + url + " status[" + xhr.status + "]");
			}
			processing(false);
		}
		xhr.onerror = function() {
			if (onError) onError.call(ibtInstance, null, 0);
			error("http: " + method + " " + url + " status[failed]");
			processing(false);
		}
		xhr.open(method, url);
		xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		//xhr.responseType = 'json';
		xhr.send(method == "POST" ? JSON.stringify(paramMap) : null);
	}
	/*****
	 * show | off body 
	 *****/
	fn.show = function(visible) {
		if (this.rootElement.body) {
			if (visible === false) {
				this.rootElement.body.style.visibility = "hidden";
			} else {
				this.rootElement.body.style.visibility = "visible";
			}
			return this;
		}

		if (visible === false) {
			this.rootElement.style.visibility = "hidden";
		} else {
			this.rootElement.style.visibility = "visible";
		}
		return this;
	}
	/*****
	 * reflect model data to elements
	 *****/
	var bindModel = function(blockSelector) {
		var element = this.rootElement.querySelector(blockSelector)
		if (!element) console.log("[error!] reflect: target not exists. " + blockSelector);
		element.innerHTML = buildTpl(blockSelector).call(this, this.model);

		/***
		 モデル表記整理、_m, =m, ~m
		 簡略表記、_ibt="_m.key." 後続続く
		 ***/
		var elements = element.querySelectorAll("[_ibm]");
		for (var idx=0; idx<elements.length; idx++) {
			var ele = elements[idx];
			var ibm = ele.getAttribute('_ibm');
			if(!ibm.endsWith(".")) continue;
			if(!(ibm.startsWith("_m.") || ibm.startsWith("=m.") || ibm.startsWith("~m."))) continue;

			normalizeIbm(ele, ibm);
		}

		var cursor = {};
		var elements = element.querySelectorAll("[_ibm]");
		for (var idx=0; idx<elements.length; idx++) {
			var ele = elements[idx];
			var accessKey = ele.getAttribute('_ibm').replaceAll(" ", "").substring(3).split(',');
			var keys = splitKey(accessKey[0]);
			ele.val(accessKey[1] || "", tarValue(this.model, keys, cursor));
		}
	}
	var normalizeIbm = function(element, prefix) {
		element.removeAttribute('_ibm');

		var children = element.querySelectorAll("[_ibm]");
		for (var idx=0; idx<children.length; idx++) {
			var ele = children[idx];
			var ibm = ele.getAttribute('_ibm');
			if(ibm.startsWith("_m.") || ibm.startsWith("=m.") || ibm.startsWith("~m.")) continue; // 直設定、または設定済み

			if (ibm.endsWith(".")) {
				normalizeIbm(ele, prefix + ibm);
				continue;
			}
			ele.setAttribute('_ibm', prefix + ibm);
		}
	}
	fn.reflect = function(blockSelector, url, paramMap, accessKeyOrFunc, onError) {
		var baseIbt = this;

		if (typeof url === 'undefined') {
			bindModel.call(baseIbt, blockSelector);
			return;
		}

		if (typeof accessKeyOrFunc === 'function') {
			var onSuccess = function(jsonResponse) {
				accessKeyOrFunc(model, jsonResponse);
				bindModel.call(baseIbt, blockSelector);
			}
			this.api(url, paramMap, onSuccess, onError);
			return;
		}

		var onSuccess = function(jsonResponse) {
			if (!accessKeyOrFunc) {
				for (var key in jsonResponse) baseIbt.model[key] = jsonResponse[key];
			} else {
				var keys = splitKey(accessKeyOrFunc);
				var tc = tarContainer(baseIbt.model, keys);
				tc[keys[keys.length-1]] = jsonResponse;
			}
			bindModel.call(baseIbt, blockSelector);
		}
		this.api(url, paramMap, onSuccess, onError);
	}
	/*****
	 * transition to next page with data
	 *****/
	fn.forward = function(url, parameter, data) {
		var form = document.createElement("form");
		var input = document.createElement("input");
		input.setAttribute('id', '__cy_client_channel');
		input.setAttribute('name', '__cy_client_channel');
		input.setAttribute('value', JSON.stringify(data));
		form.append(input);

		form.setAttribute('method', 'post');
		form.setAttribute('action', this.urlStringify(url, parameter));
		form.submit();
	}
	/*****
	 * transition to next page
	 *****/
	fn.locate = function(url, parameter) {
		window.location.href = this.urlStringify(url, parameter);
	}
	fn.prevdata = function() {
		if (!_PREV_DATA) {
			_PREV_DATA = JSON.parse(_ibt.s("#__cy_client_channel").val());
		}
		return _PREV_DATA;
	}
	fn.persist = function(accessKey, data) {
		// TODO, save to redis
	}

	/*************************************************
	 * Modal | MsgBox | loading
	 *************************************************/
	function Modal(html, cssPrefix, autoClose) {
		this.html = html;
		this.cssPrefix = cssPrefix;
		this.autoClose = autoClose;
	};
	var modal = Modal.prototype;

	modal.open = function(closeBtn) {
		var thisInstance = this;

		var form = document.createElement('div');
		form.classList.add(this.cssPrefix + "_form");
		form.innerHTML = this.html;

		var container = document.createElement('div');
		container.classList.add(this.cssPrefix + "_overlay");
		container.appendChild(form);
		
		if (this.autoClose) {
			form.onclick = function(e) {e.stopPropagation();}
			container.onclick = function() {thisInstance.close();}
		}
		if (closeBtn) {
			form.querySelector(closeBtn).onclick = function() {thisInstance.close();}
		}

		document.body.appendChild(container);
		setTimeout(function(cssPrefix) {
			form.classList.add(cssPrefix + "_form_show");
			container.classList.add(cssPrefix + "_overlay_show");
		}, 120, this.cssPrefix);

		this.form = form;
		this.container = container;

		return new IsBoringTemplate(container);
	}
	modal.close = function() {
		this.form.classList.remove(this.cssPrefix + "_form_show");
		this.form.classList.add(this.cssPrefix + "_form_closing");
		this.form.classList.remove(this.cssPrefix + "_overlay_show");
		this.container.classList.add(this.cssPrefix + "_overlay_closing");

		setTimeout(function(container) {
			document.body.removeChild(container);
		}, 300, this.container);
	}
	/*****
	 * create new MsgBox
	 *****/
	fn.newMsgBox = function (selector, model) {
		var html = this.s(selector).innerHTML;
		html = build(html).call(this, model);
		return new Modal(html, "msgbox", true);
	}
	/*****
	 * create new Modal
	 *****/
	fn.newModal = function (url, queryMap, model) {
		var html = exttpl(url, queryMap);
		html = build(html).call(this, model);
		return new Modal(html, "modal", true);
	};
	var processingIcon;
	var processing = function(start) {
		if (start === false) {
			if (processingIcon) {
				processingIcon.close();
				processingIcon = null;
			}
			return;
		}

		if (processingIcon) return;
		var processingHtml = "<span class='processing'></span>";
		processingIcon = new Modal(processingHtml, "processing");
		processingIcon.open();
	}
	fn.processing = processing






	/*************************************************
	 * publish
	 *************************************************/
	var _ibt = new IsBoringTemplate(document);
	setTimeout(function() {
		//_ibt.show(false);
	});
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

				if (typeof _ibt.onload === 'function') {
					_ibt.onload();
					_ibt.show(true);
					return;
				}

				window.addEventListener("load", function () {
					if (typeof _ibt.onload === 'function') {
						_ibt.onload();
						_ibt.show(true);
					}
				});

			});
			break;
		default : // interactive, complete
			if (typeof _ibt.onload === 'function') {
				_ibt.onload();
				_ibt.show(true);
				return;
			}

			window.addEventListener("load", function () {
				if (typeof _ibt.onload === 'function') {
					_ibt.onload();
					_ibt.show(true);
				}
			});
			break;
	}
})(this);
