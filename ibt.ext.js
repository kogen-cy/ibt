/*
@author kogen.cy
@author y.cycau@gmail.com
@see "https://github.com/kogen-cy/ibt"
@version 2.1
*/

(function (global) {
	if (typeof IsBoringTemplate !== "function") console.error("load [ibt.core.js] first, please.");

	var error = function(msg) {
		console.error("[error!] " + msg);
	}

	var msgboxStyle = function (overlayStyle, formStyle) {
		overlayStyle['visibility'] = "hidden";
		overlayStyle['opacity'] = "0";
		overlayStyle['position'] = "fixed";
		overlayStyle['top'] = "0";
		overlayStyle['left'] = "0";
		overlayStyle['right'] = "0";
		overlayStyle['bottom'] = "0";
		overlayStyle['z-index'] = "9998";
		overlayStyle['transition-duration'] = "0.5s";
		overlayStyle['background-color'] = "rgba(0, 0, 0, .05)";

		formStyle['position'] = "fixed";
		formStyle['top'] = "0%";
		formStyle['left'] = "50%";
		formStyle['z-index'] = "9999";
		formStyle['max-width'] = "90vw";
		formStyle['max-height'] = "90vh";
		formStyle['box-sizing'] = "border-box";
		formStyle['padding'] = "5px";
		formStyle['border-radius'] = "5px";
		formStyle['background-color'] = "#fff";
		formStyle['transform'] = "translate(-50%, 0%)";
		formStyle['transition-duration'] = "0.3s";
		formStyle['border'] = "1px solid gray";
	}
	var modalStyle = function (overlayStyle, formStyle) {
		overlayStyle['visibility'] = "hidden";
		overlayStyle['opacity'] = "0";
		overlayStyle['position'] = "fixed";
		overlayStyle['top'] = "0";
		overlayStyle['left'] = "0";
		overlayStyle['right'] = "0";
		overlayStyle['bottom'] = "0";
		overlayStyle['z-index'] = "9988";
		overlayStyle['transition-duration'] = "0.5s";
		overlayStyle['background-color'] = "rgba(0, 0, 0, .25)";

		formStyle['position'] = "fixed";
		formStyle['top'] = "50%";
		formStyle['left'] = "50%";
		formStyle['z-index'] = "9989";
		formStyle['max-width'] = "90vw";
		formStyle['max-height'] = "90vh";
		formStyle['box-sizing'] = "border-box";
		formStyle['padding'] = "5px";
		formStyle['border-radius'] = "5px";
		formStyle['background-color'] = "#fff";
		formStyle['transition-duration'] = "0.3s";
		formStyle['transform'] = "translate(-50%, -50%)";
	}

	/*****
	 * Modal | MsgBox
	 *****/
	function Modal(mode, html) {
		this.mode = mode; // Modal | msgBox
		this.html = html;
	};
	var modal = Modal.prototype;
	
	modal.open = function() {
		var thisInstance = this;

		var form = document.createElement('div');
		form.innerHTML = this.html;

		var container = document.createElement('div');
		container.appendChild(form);
		this.mode == "B" ? msgboxStyle(container.style, form.style) : modalStyle(container.style, form.style);
		form.onclick = function(e) {e.stopPropagation();}
		container.onclick = function() {thisInstance.close();}

		document.body.appendChild(container);
		setTimeout(function(mode) {
			if (mode == "B") form.style['top'] = "5%";
			container.style['visibility'] = "visible";
			container.style['opacity'] = "1";
		}, 120, this.mode);

		this.form = form;
		this.container = container;

		return new IsBoringTemplate(container);
	}
	modal.close = function() {
		if (this.mode == "B") this.form.style['top'] = "0.5%";
		this.container.style['visibility'] = "hidden";
		this.container.style['opacity'] = "0";
		setTimeout(function(container) {
			document.body.removeChild(container);
		}, 300, this.container);
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
		var ele = this;

		if (valAttr) return ele.getAttribute(valAttr);
		if (ele.hasAttribute("_ibtV")) return ele.getAttribute("_ibtV");
		if (ele.hasAttribute("_ibtVa")) return ele.getAttribute(ele.getAttribute("_ibtVa"));
		if (typeof ele.value !== 'undefined') return ele.value;

		return ele.innerHTML;
	}
	/*****
	 * set value
	 * set priority 0:[valAttr] 10:[_ibtV] 20:[[_ibtVa]] 30:value 40:innerHTML
	 *****/
	var set = function (val, valAttr) {
		var ele = this;

		if (valAttr) {ele.setAttribute(valAttr, val); return this;}
		if (ele.hasAttribute("_ibtV")) {ele.setAttribute("_ibtV", val); return this;}
		if (ele.hasAttribute("_ibtVa")) {ele.setAttribute(ele.getAttribute("_ibtVa"), val); return this;}
		if (typeof ele.value !== 'undefined') {ele.value = val; return this;}

		ele.innerHTML = val;
		return this;
	}

	var extractVal = function(valsSrc, valsTar) {
		var isArray = valsTar instanceof Array;
		
		for (var key in valsSrc) {
			if (key == "_ibt") continue;
			if (key == "_ibtIdx") continue;

			var val = valsSrc[key];
			if (val == null) continue;
			if (!val._ibt) {
				if (isArray) {
					valsTar.push(val);
				} else {
					valsTar[key] = val;
				}
				continue;
			}

			var container;
			if (val._ibt == "M") {
				container = {};
			} else {
				container = [];
			}
			if (isArray) {
				valsTar.push(container);
				extractVal(val, valsTar[valsTar.length-1]);
			} else {
				valsTar[key] = container;
				extractVal(val, valsTar[key]);
			}
		}
	}
	/*****
	 * return map values
	 * keyAttr default _ibtK
	 * keyAttr format "mapKey1.listKey2[].listKey3[n].[m].key4 ..."
	 * valAttr priority 0:[valAttr] 10:[_ibtV] 20:[[_ibtVa]] 30:value 40:innerHTML
	 *****/
	var gets = function (keyAttr, valAttr) {
		var range = this;
		var REGlist = new RegExp(/^(.+)\[([\d|\+|\-]*)\]$/);

		var vals = {};
		keyAttr = keyAttr || "_ibtK";
		var	elements = range.querySelectorAll("[" + keyAttr + "]");
		for (var idxEle=0; idxEle<elements.length; idxEle++) {
			var container = vals;
			var ele = elements[idxEle];

			var key;
			var keys = ele.getAttribute(keyAttr).split(".");
			var maxIdx = keys.length - 1;
			for (var idx=0; idx<=maxIdx; idx++) {
				key = keys[idx];
				
				if (key.endsWith("]")) {
					var m = key.match(REGlist);
					if (m[1]) {
						if (!container[m[1]]) container[m[1]] = {_ibt:"L", _ibtIdx:-1};
						container = container[m[1]];
					}
					if (idx == maxIdx) {
						if (m[2] == "+") {
							key = container._ibtIdx += 1;
						} else if (m[2] == "-") {
							key = container._ibtIdx -= 1;
						} else if (m[2] == "") {
							key = container._ibtIdx += 1;
						} else {// fixed index
							key = parseInt(m[2]); 
						}
						if (key < 0) key = 0;
						if (container._ibtIdx < 0) container._ibtIdx = 0;
						break;
					}

					var listPos;
					if (m[2] == "+") {
						listPos = container._ibtIdx += 1;
					} else if (m[2] == "-") {
						listPos = container._ibtIdx -= 1;
					} else if (m[2] == "") {
						listPos = container._ibtIdx;
					} else {// fixed index
						listPos = parseInt(m[2]);
					}
					if (listPos < 0) listPos = 0;
					if (container._ibtIdx < 0) container._ibtIdx = 0;

					if (!container[listPos]) {
						if (keys[idx+1].startsWith("[")) { //arrayKey[].[]
							container[listPos] = {_ibt:"L", _ibtIdx:-1};
						} else {
							container[listPos] = {_ibt:"M"};
						}
					}

					container = container[listPos];
					continue;
				}

				if (idx == maxIdx) break;

				if (!container[key]) {
					if (keys[idx+1].startsWith("[")) { //mapKey.[]
						container[key] = {_ibt:"L", _ibtIdx:-1};
					} else {
						container[key] = {_ibt:"M"};
					}
				}
				container = container[key];
			}

			if (valAttr) {container[key] = ele.getAttribute(valAttr); continue;}
			if (ele.hasAttribute("_ibtV")) {container[key] = ele.getAttribute("_ibtV"); continue;}
			if (ele.hasAttribute("_ibtVa")) {container[key] = ele.getAttribute(ele.getAttribute("_ibtVa")); continue;}
			if (typeof ele.value !== 'undefined') {container[key] = ele.value; return this;}

			container[key] = ele.innerHTML;
		}

		var finalVals = {};
		extractVal(vals, finalVals);
		return finalVals;
	}
	var css = function () {
		var ele = this;

		return ele.classList;
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
			var REGlist = new RegExp(/^(.+)\[([\d|\+|\-]*)\]$/);
			
			var listCursor = {};
			var elements = divTmp.querySelectorAll("[_ibtK]");
			for (var idxEle=0; idxEle<elements.length; idxEle++) {
				var ele = elements[idxEle];
				var ibtKs = ele.getAttribute("_ibtK").replaceAll(" ", "").split(".");

				var ibtV = modelData;
				var listCur = listCursor;
				var maxIdx = ibtKs.length - 1;
				for (var idx=0; idx<=maxIdx; idx++) {
					var key = ibtKs[idx];

					if (key.endsWith("]")) {
						var m = key.match(REGlist);
						if (m[1]) {
							ibtV = ibtV[m[1]];
							if (typeof ibtV == "undefined" || ibtV == null) {
								ibtV = "";
								break;
							}
							if (!listCur[m[1]]) listCur[m[1]] = {_ibtIdx:-1};
							listCur = listCur[m[1]];
						}
						if (typeof ibtV.length == "undefined") {
							ibtV = "";
							break;
						}

						if (idx==maxIdx) {
							var listPos;
							if (m[2] == "+") {
								listPos = listCur._ibtIdx += 1;
							} else if (m[2]== "-") {
								listPos = listCur._ibtIdx -= 1;
							} else if (m[2]== "") {
								listPos = listCur._ibtIdx += 1;
							} else {
								listPos = parseInt(m[2]);
							}

							if (listCur._ibtIdx <  0) listCur._ibtIdx = -1;
							if (listCur._ibtIdx >= ibtV.length) listCur._ibtIdx = ibtV.length;
							if (listPos < 0 || listPos >= ibtV.length) {
								ibtV = "";
							} else {
								ibtV = ibtV[listPos];
							}
							break;
						}

						var listPos;
						if (m[2] == "+") {
							listPos = listCur._ibtIdx += 1;
						} else if (m[2]== "-") {
							listPos = listCur._ibtIdx -= 1;
						} else if (m[2]== "") {
							listPos = listCur._ibtIdx;
						} else {
							listPos = parseInt(m[2]);
						}

						if (listCur._ibtIdx <  0) listCur._ibtIdx = -1;
						if (listCur._ibtIdx >= ibtV.length) listCur._ibtIdx = ibtV.length;
						if (listPos < 0 || listPos >= ibtV.length) {
							ibtV = "";
							break;
						}

						ibtV = ibtV[listPos];
						if (!listCur[listPos]) listCur[listPos] = {_ibtIdx:-1};
						listCur = listCur[listPos];
						continue;
					}
					
					ibtV = ibtV[key];
					if (typeof ibtV == "undefined" || ibtV == null) {ibtV = ""; break;}
					if (idx==maxIdx) break;

					if (!listCur[key]) listCur[key] = {_ibtIdx:-1};
					listCur = listCur[key];
				}

				if (ele.hasAttribute("_ibtV")) {ele.setAttribute("_ibtV", ibtV); continue;}
				if (ele.hasAttribute("_ibtVa")) {ele.setAttribute(ele.getAttribute("_ibtVa"), ibtV); continue;}
				if (typeof ele.value !== 'undefined') {ele.value = ibtV; continue;}
				ele.innerHTML = ibtV;
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
					response = {};
					response.response = xhr.responseText;
				} else {
					response = "ERROR!";
				}
			}
			if (xhr.status == 200) {
				if (onSuccess) onSuccess.call(ibtInstance, response, xhr.status);
				return;
			}
			if (onError) onError.call(ibtInstance, response, xhr.status);
			error("http: " + method + " " + url + " status[" + xhr.status + "]");
		}
		xhr.onerror = function() {
			if (onError) onError.call(ibtInstance, null, 0);
			error("http: " + method + " " + url + " status[failed]");
		}
		xhr.open(method, url);
		xhr.setRequestHeader("Content-Type", "application/json");
		//xhr.responseType = 'json';
		xhr.send(method == "POST" ? JSON.stringify(queryMap) : null);
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
	 * create new MsgBox
	 *****/
	fn.newMsgbox = function (selector, modelData, selectorYes, selectorCancel, selectorClose, selectorNo) {
		var html = this.s(selector).innerHTML;
		html = this.build(this.prepare(html)).call(this, modelData);
		return new Modal("B", html, selectorYes, selectorCancel, selectorClose, selectorNo);
	}
	/*****
	 * create new Dialog
	 *****/
	fn.newModal = function (url, queryMap, modelData, selectorYes, selectorCancel, selectorClose, selectorNo) {
		var html = this.exttpl(url, queryMap);
		html = this.build(this.prepare(html)).call(this, modelData);
		return new Modal("M", html, selectorYes, selectorCancel, selectorClose, selectorNo);
	};

})(this);
