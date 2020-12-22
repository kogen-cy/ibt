/*
@author kogen.cy
@author y.cycau@gmail.com
@see "https://github.com/kogen-cy/ibt"
@version 2.9
*/

(function (global) {
	if (typeof IsBoringTemplate !== "function") console.error("load [ibt.core.js] first, please.");

	var error = function(msg) {
		console.error("[error!] " + msg);
	}

	/*****
	 * Modal | MsgBox | loading
	 *****/
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
	/***********************************************************/
	var s = function(selector) {
		return this.querySelector(selector);
	}
	var S = function(selector) {
		return this.querySelectorAll(selector);
	}
	/*****
	 * get value
	 * get priority 0:[valAttr] 10:[_ibtV] 20:[[_ibtVa]] 30:value 40:innerHTML
	 *****/
	var get = function(valAttr) {
		if (valAttr) return this.getAttribute(valAttr);
		if (this.hasAttribute("_ibtV")) return this.getAttribute("_ibtV");
		if (this.hasAttribute("_ibtVa")) return this.getAttribute(this.getAttribute("_ibtVa"));
		if (typeof this.value !== 'undefined') return this.value;

		return this.innerHTML;
	}
	/*****
	 * set value
	 * set priority 0:[valAttr] 10:[_ibtV] 20:[[_ibtVa]] 30:value 40:innerHTML
	 *****/
	var set = function (val, valAttr) {
		if (valAttr) {this.setAttribute(valAttr, val); return this;}
		if (this.hasAttribute("_ibtV")) {this.setAttribute("_ibtV", val); return this;}
		if (this.hasAttribute("_ibtVa")) {this.setAttribute(this.getAttribute("_ibtVa"), val); return this;}
		if (typeof this.value !== 'undefined') {this.value = val; return this;}

		this.innerHTML = val;
		return this;
	}

	/*****
	 * return map values
	 * keyAttr default _ibtK
	 * keyAttr format "mapKey1.listKey2[].listKey3[n].[m].key4 ..."
	 * valAttr priority 0:[valAttr] 10:[_ibtV] 20:[[_ibtVa]] 30:value 40:innerHTML
	 *****/
	var gets = function (keyAttr, valAttr) {
		var curInfo = {};
		var modelData = {};
		keyAttr = keyAttr || "_ibtK";
		var elements = this.querySelectorAll("[" + keyAttr + "]");
		for (var idxEle=0; idxEle<elements.length; idxEle++) {
			var ele = elements[idxEle];
			var ibtK = ele.getAttribute(keyAttr).replaceAll(" ", "");
			ibtK = ibtK.replaceAll("[", ".[").replaceAll("..", ".");
			var keys = ibtK.split(".");

			var fullKey = "K";
			var _CTN = modelData;
			var maxIdx = keys.length - 1;
			for (var idx=0; idx<=maxIdx; idx++) {
				var key = keys[idx];
				
				if (!key.endsWith("]")) {
					if (!(_CTN instanceof Object)) {
						error("not a MAP. " + ibtK + "=>" + fullKey);
						break;
					}

					if (idx == maxIdx) {
						_CTN[key] = ele.get(valAttr);
						break;
					}

					if (!_CTN[key]) {
						if (keys[idx+1].startsWith("[")) {
							_CTN[key] = [];
						} else {
							_CTN[key] = {};
						}
					}
					_CTN = _CTN[key];
					fullKey += "." + key;
					continue;
				}

				if (!(_CTN instanceof Array)) {
					error("not a LIST. " + ibtK + "=>" + fullKey);
					break;
				}

				/***
				 * []   current cursor, or next when plain object
				 * [n]  n's value, current cursor won't to be move
				 * [+n] cursor move to next n, n=1 when empty
				 * [-n] cursor move to previous n
				 * [!n] cursor move to n, and create objects when list size <= n
				 ***/
				var ctlNum = key.substring(1, key.length-1);
				var cursor = curInfo[fullKey];
				if (typeof cursor == "undefined") cursor = -1;
				var setIdx = cursor;
				if (ctlNum == ""){
					if (idx==maxIdx) {
						cursor += 1;
						setIdx  = cursor;
					}
				} else if(ctlNum.startsWith("+")){
					ctlNum = ctlNum.substring(1);
					if (ctlNum == "") ctlNum = "1";
					cursor += parseInt(ctlNum);
					setIdx  = cursor;
				} else if(ctlNum.startsWith("-")) 	{
					ctlNum = ctlNum.substring(1);
					if (ctlNum == "") ctlNum = "1";
					cursor -= parseInt(ctlNum);
					setIdx  = cursor;
				} else if(ctlNum.startsWith("!")) {
					ctlNum = ctlNum.substring(1);
					if (ctlNum == "") ctlNum = "0";
					cursor  = parseInt(ctlNum);
					setIdx  = cursor;
				} else {
					setIdx  = parseInt(ctlNum);
				}
				if (cursor < 0) cursor = -1;
				curInfo[fullKey] = cursor;

				fullKey += "." + setIdx;
				if (idx == maxIdx) {
					for (var listIdx=_CTN.length-1; listIdx<(cursor-1); listIdx++) _CTN.push(null);
					
					if (cursor == _CTN.length) {
						_CTN.push(ele.get(valAttr));
					} else if (setIdx > -1 && setIdx < _CTN.length) {
						_CTN[setIdx] = ele.get(valAttr);
					} else {
						error("index out of bouds. size:" + _CTN.length + " " + ibtK + "=>" + fullKey);
					}
					break;
				}
				
				if (keys[idx+1].startsWith("[")) {
					for (var listIdx=_CTN.length-1; listIdx<cursor; listIdx++) _CTN.push([]);
				} else {
					for (var listIdx=_CTN.length-1; listIdx<cursor; listIdx++) _CTN.push({});
				}

				if (setIdx > -1 && setIdx < _CTN.length) {
					_CTN = _CTN[setIdx];
					continue;
				}
				
				error("index out of bouds. size:" + _CTN.length + " " + ibtK + "=>" + fullKey);
				break;
			}
		}

		return modelData;
	}
	var css = function () {
		return this.classList;
	}
	/*************************************************************/
	Element.prototype.s = s;
	Element.prototype.S = S;
	Element.prototype.get = get;
	Element.prototype.set = set;
	Element.prototype.gets = gets;
	Element.prototype.classes = css;
	/*************************************************************/
	var fn = IsBoringTemplate.prototype;
	fn.error = error;
	fn.s = function (selector) {
		return s.call(this.rootElement, selector);
	}
	fn.S = function (selector) {
		return S.call(this.rootElement, selector);
	}
	fn.gets = function (keyAttr, valAttr) {
		return gets.call(this.rootElement, keyAttr, valAttr);
	}
	// overwrite;
	var build = fn.build;
	fn.build = function (strHtml) {
		var tplFunc = build.call(this, strHtml);

		return function(modelData){
			var divTmp = document.createElement('div');
			divTmp.innerHTML = tplFunc.call(this, modelData);
			
			var curInfo = {};
			var elements = divTmp.querySelectorAll("[_ibtK]");
			for (var idxEle=0; idxEle<elements.length; idxEle++) {
				var ele = elements[idxEle];
				var ibtK = ele.getAttribute("_ibtK").replaceAll(" ", "");
				ibtK = ibtK.replaceAll("[", ".[").replaceAll("..", ".");
				var keys = ibtK.split(".");

				var fullKey = "K";
				var _CTN = modelData;
				var maxIdx = keys.length - 1;
				for (var idx=0; idx<=maxIdx; idx++) {
					var key = keys[idx];

					if (!key.endsWith("]")) {
						if (!(_CTN instanceof Object)) {
							error("not a MAP. " + ibtK + "=>" + fullKey);
							_CTN = "";
							break;
						}

						_CTN = _CTN[key];
						if (typeof _CTN == "undefined") {
							error("key not exists. " + ibtK + "=>" + fullKey);
							_CTN = "";
							break;
						}
						fullKey += "." + key;
						continue;
					}

					if (!(_CTN instanceof Array)) {
						error("not a LIST. " + ibtK + "=>" + fullKey);
						_CTN = "";
						break;
					}

					/***
					 * []   current cursor, or next when plain object
					 * [n]  n's value, current cursor won't to be move
					 * [+n] cursor move to next n, n=1 when empty
					 * [-n] cursor move to previous n
					 * [!n] cursor move to n, and create objects when list size <= n
					 ***/
					var ctlNum = key.substring(1, key.length-1);
					var cursor = curInfo[fullKey];
					if (typeof cursor == "undefined") cursor = -1;
					var getIdx = cursor;
					if (ctlNum == ""){
						if (idx==maxIdx) {
							cursor += 1;
							getIdx  = cursor;
						}
					} else if(ctlNum.startsWith("+")){
						ctlNum = ctlNum.substring(1);
						if (ctlNum == "") ctlNum = "1";
						cursor += parseInt(ctlNum);
						getIdx  = cursor;
					} else if(ctlNum.startsWith("-")) 	{
						ctlNum = ctlNum.substring(1);
						if (ctlNum == "") ctlNum = "1";
						cursor -= parseInt(ctlNum);
						getIdx  = cursor;
					} else if(ctlNum.startsWith("!")) {
						ctlNum = ctlNum.substring(1);
						if (ctlNum == "") ctlNum = "0";
						cursor  = parseInt(ctlNum);
						getIdx  = cursor;
					} else {
						getIdx  = parseInt(ctlNum);
					}
					if (cursor < 0) cursor = -1;
					if (cursor >= _CTN.length) cursor = _CTN.length;
					curInfo[fullKey] = cursor;
					
					fullKey += "." + getIdx;
					if (getIdx > -1 && getIdx < _CTN.length) {
						_CTN = _CTN[getIdx];
						continue;
					}

					error("index out of bounds. size:" + _CTN.length + " " + ibtK + "=>" + fullKey);
					_CTN = "";
					break;
				}

				ele.set(_CTN);
			}
			return divTmp.innerHTML;
		}
	}
	/*****
	 * HTTP request
	 * 	 default : GET JSON
	 * 	 you can set paramMap to {_method:'POST', _responseType:'TEXT'}
	 *****/
	fn.http = function(url, paramMap, onSuccess, onError) {
		processing();

		var ibtInstance = this;
		var method = "GET";
		var responseType = "JSON";

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
		xhr.setRequestHeader("Content-Type", "application/json");
		//xhr.responseType = 'json';
		xhr.send(method == "POST" ? JSON.stringify(queryMap) : null);
	}
	/*****
	 * request HTTP & replace inner contents
	 *****/
	fn.reflectR = function(url, paramMap, tplSelector, tarSelector, dataProcess, postProcess, onError) {
		var onSuccess = function(jsonResponse) {
			if (dataProcess) jsonResponse = dataProcess(jsonResponse);
			if (jsonResponse) this.reflect(jsonResponse, tplSelector, tarSelector);
			if (postProcess) postProcess(jsonResponse);
		}
		this.http(url, paramMap, onSuccess, onError);
	}
	/*****
	 * request HTTP & prepend to inner contents
	 *****/
	fn.prependR = function(url, paramMap, tplSelector, tarSelector, dataProcess, postProcess, onError) {
		var onSuccess = function(jsonResponse) {
			if (dataProcess) jsonResponse = dataProcess(jsonResponse);
			if (jsonResponse) this.prepend(jsonResponse, tplSelector, tarSelector);
			if (postProcess) postProcess(jsonResponse);
		}
		this.http(url, paramMap, onSuccess, onError);
	}
	/*****
	 * request HTTP & append to inner contents
	 *****/
	fn.appendR = function(url, paramMap, tplSelector, tarSelector, dataProcess, postProcess, onError) {
		var onSuccess = function(jsonResponse) {
			if (dataProcess) jsonResponse = dataProcess(jsonResponse);
			if (jsonResponse) this.append(jsonResponse, tplSelector, tarSelector);
			if (postProcess) postProcess(jsonResponse);
		}
		this.http(url, paramMap, onSuccess, onError);
	}
	/*****
	 * request HTTP & remove target
	 *****/
	fn.removeR = function(url, paramMap, tarSelector, dataProcess, postProcess, onError) {
		var onSuccess = function(jsonResponse) {
			if (dataProcess) jsonResponse = dataProcess(jsonResponse);
			if (jsonResponse) this.remove(tarSelector);
			if (postProcess) postProcess(jsonResponse);
		}
		this.http(url, paramMap, onSuccess, onError);
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
	 * show processing icon
	 *****/
	fn.processing = processing

	/*****
	 * create new MsgBox
	 *****/
	fn.newMsgBox = function (selector, modelData) {
		var html = this.s(selector).innerHTML;
		html = this.build(html).call(this, modelData);
		return new Modal(html, "msgbox", true);
	}
	/*****
	 * create new Modal
	 *****/
	fn.newModal = function (url, queryMap, modelData) {
		var html = this.exttpl(url, queryMap);
		html = this.build(html).call(this, modelData);
		return new Modal(html, "modal", true);
	};

})(this);
