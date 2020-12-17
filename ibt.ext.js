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
		formStyle['max-width'] = "80vw";
		formStyle['max-height'] = "80vh";
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
		formStyle['max-width'] = "80vw";
		formStyle['max-height'] = "80vh";
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
	
	modal.open = function () {
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
		}, 100, this.mode);

		this.form = form;
		this.container = container;

		return new IsBoringTemplate(container);
	}
	modal.close = function () {
		if (this.mode == "B") this.form.style['top'] = "0.5%";
		this.container.style['visibility'] = "hidden";
		this.container.style['opacity'] = "0";
		setTimeout(function(container) {
			document.body.removeChild(container);
		}, 300, this.container);
	}

	/***********************************************************/
	var s = function (selector) {
		return this.querySelector(selector);
	}
	var S = function (selector) {
		return this.querySelectorAll(selector);
	}
	/*****
	 * _ibt.get("#id")
	 * _ibt.get("#id", valAttr)
	 * value 0:[valAttr] 10:[_ibtVal] 20:[[_ibtValAttr]] 30:nodeValue
	 *****/
	var get = function (selector, valAttr) {
		var ele = this;
		if (selector) ele = this.querySelector(selector);
    	if (!ele) {
    		error("getVal: not found target. " + selector);
    		return null;
    	}

    	if (valAttr) return ele.getAttribute(valAttr);
    	if (ele.hasAttribute("_ibtVal")) return ele.getAttribute("_ibtVal");
    	if (ele.hasAttribute("_ibtValAttr")) return ele.getAttribute(ele.getAttribute("_ibtValAttr"));
    	if (typeof ele.value !== 'undefined') return ele.value;

    	return ele.innerHTML;
    }
	/*****
	 * _ibt.set("#id", VAL)
	 * _ibt.set("#id", VAL, valAttr)
	 * value 0:[valAttr] 10:[_ibtVal] 20:[[_ibtValAttr]] 30:nodeValue
	 *****/
	var set = function (selector, val, valAttr) {
		var ele = this;
		if (selector) ele = this.querySelector(selector);
    	if (!ele) {
    		error("setVal: not found target. " + selector);
    		return this;
    	}

    	if (valAttr) {ele.setAttribute(valAttr, val); return this;}
    	if (ele.hasAttribute("_ibtVal")) {ele.setAttribute("_ibtVal", val); return this;}
    	if (ele.hasAttribute("_ibtValAttr")) {ele.setAttribute(ele.getAttribute("_ibtValAttr"), val); return this;}
    	if (typeof ele.value !== 'undefined') {ele.value = val; return this;}

    	ele.innerHTML = val;
    	return this;
    }

	/*****
	 * _ibt.gets("#block") keyAttr default "_ibtKey"
	 * _ibt.gets("#block", "id")
	 * _ibt.gets("#block", "_ibtId", "_ibtVal")
	 * keyAttr format "mapKey1.listKey2[].listKey3[n].[m].key4 ..."
	 * value priority 0:[valAttr] 10:[_ibtVal] 20:[[_ibtValAttr]] 30:nodeValue
	 *****/
	var gets = function (selector, keyAttr, valAttr) {
    	var range = this;
    	if (selector) range = this.querySelector(selector);
    	if (!range) {
    		error("getVals: not found target. " + selector);
    		return null;
    	}

    	var vals = {};
    	keyAttr = keyAttr || "_ibtKey";
    	var	elements = range.querySelectorAll("[" + keyAttr + "]");
    	for (var idxEle=0; idxEle<elements.length; idxEle++) {
        	var container = vals;
        	var ele = elements[idxEle];

        	var key;
    		var keys = ele.getAttribute(keyAttr).split(".");
    		var maxIdx = keys.length - 1;
    		for (var idx=0; idx<=maxIdx; idx++) {
    			key = keys[idx];
    			
    			if (idx == maxIdx) {
            		if (key.endsWith("]")) {
            			var m = key.match(/(.+)\[(\d*)\]$/);
            			if (m[1]) {
                			if (!container[m[1]]) container[m[1]] = [];
                			container = container[m[1]];
            			}
        				if (m[2] == "+") {
            				container.push(null);
            				key = container.length - 1;
            				continue;
        				}
            			if (m[2]) {
                			key = parseInt(m[2]);
                			for (var arrayIdx = container.length-1; arrayIdx < key; arrayIdx++) {
                				container.push(null);
                			}
                			continue;
            			}

        				container.push(null);
        				key = container.length - 1;
            		}
        			continue;
    			}

        		// arrayKey[+].[] new
    			var nextTypeList = keys[idx+1].match(/^\[(\d*)\]$/) ? true : false;
    			if (key.endsWith("]")) {
        			var m = key.match(/(.+)\[([\d|\+]*)\]$/);
        			if (m[1]) {
            			if (!container[m[1]]) container[m[1]] = [];
            			container = container[m[1]];
        			}

        			var listPos = container.length - 1;
    				if (m[2]) {
    					if (m[2] == "+") { // add new container
    						listPos = container.length;
    					} else {
    						listPos = parseInt(m[2]);
    					}
    				}
    				if (listPos < 0) {
    					error("getVals: id setting error. " + keys);
    					continue;
    				}
        				
        			if (nextTypeList) {
        				for (var listIdx = container.length-1; listIdx < listPos; listIdx++) container.push([]);
        			} else {
        				for (var listIdx = container.length-1; listIdx < listPos; listIdx++) container.push({});
        			}
        			container = container[listPos];
        			continue;
        		}

        		// mapKey.[]
        		if (nextTypeList) {
        			if (!container[key]) container[key] = [];
        			container = container[key];
        			continue;
        		}

        		if (!container[key]) container[key] = {};
        		container = container[key];
    		}

    		if (valAttr) {container[key] = ele.getAttribute(valAttr); continue;}
    		if (ele.hasAttribute("_ibtVal")) {container[key] = ele.getAttribute("_ibtVal"); continue;}
    		if (ele.hasAttribute("_ibtValAttr")) {container[key] = ele.getAttribute(ele.getAttribute("_ibtValAttr")); continue;}
        	if (typeof ele.value !== 'undefined') {container[key] = ele.value; return this;}

    		container[key] = ele.innerHTML;
    	}
    	return vals;
    }
	var classes = function (selector) {
		var ele = this;
		if (selector) ele = this.querySelector(selector);
    	if (!ele) {
    		error("classes: not found target. " + selector);
    		return null;
    	}

    	return ele.classList;
    }
	/*************************************************************/
	Element.prototype.s = s;
	Element.prototype.S = S;
	Element.prototype.get = get;
	Element.prototype.set = set;
	Element.prototype.gets = gets;
	Element.prototype.classes = classes;
	/*************************************************************/
	var fn = IsBoringTemplate.prototype;
	fn.error = error;
	fn.s = function (selector) {
		return s.call(this.rootElement, selector);
	}
	fn.S = function (selector) {
		return S.call(this.rootElement, selector);
	}
	fn.get = function (selector, valAttr) {
		return get.call(this.rootElement, selector, valAttr);
	}
	fn.set = function (selector, val, valAttr) {
		return set.call(this.rootElement, selector, val, valAttr);
	}
	fn.gets = function (selector, keyAttr, valAttr) {
		return gets.call(this.rootElement, selector, keyAttr, valAttr);
	}
	fn.classes = function (selector) {
		return classes.call(this.rootElement, selector);
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
			console.log("[error!] http " + method + " " + url + " status[failed]");
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
	fn.newMsgBox = function (selector, modelData, selectorYes, selectorCancel, selectorClose, selectorNo) {
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
