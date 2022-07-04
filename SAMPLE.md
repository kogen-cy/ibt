# ibt example  

##### functions of core  
```
_ibt.onload()
_ibt.s(selector) // select one element
_ibt.S(selector) // select all elements
_ibt.m(accessKey, data) // set data to model, or get data
_ibt.api(url, paramMap, onSuccess, onError) // call remote api
_ibt.reflect(blockSelector, url, paramMap, accessKeyOrFunc, onError) // reflect data to page
_ibt.forward(url, parameter, data)
_ibt.locate(url, parameter)
_ibt.prevdata()

_ibt.show(visible) //show or hidden document, or modal
_ibt.processing() //show loading icon
_ibt.newMsgBox(selector, modelData) //create message box, specify selector to tell it is form of message box
_ibt.newModal(url, queryMap, modelData) //create modal, specify url to tell where to gets form of modal

_ibt.exttpl(url, queryMap) //call http and return html
_ibt.encode(strHtml) //encode html and embed to document when you need

```


##### extended functions  
```
```


##### example  
```
/***************************
 * description in the html *
 ***************************/
{{# some value }} print [some value] as it is
{{@ some value }} print encoded [some value]
{{% some javascript }} run some javascript
in the outer html area, you'd better surround with <!-- -->, like this <!-- {{@ some }}-->

/***
 display block only when the condition is true, [_m] is inputted model
 ***/
<div _ibt="if(_m.val1==_m.val2)">
<div _ibt="if(_m.val1==_m.val2) continue | break"> //continue or break to display when under loop. current block will not to be display

/***
 loop block
 ***/
<div _ibt="for(var idx in _m.list)">
<div _ibt="for(var idx=0; idx<_m.list.length; idx++;)">
<div _ibt="for(var idx=0; idx<_m.list.length; idx++;) var row=_m.list[idx]"> //loop with some logic, in this case the [row] can be used in child elements

/***
 load remote html
 ***/
<div _ibt="exttpl('/path/block1.html', {queryParam:'val'})">

/***
 ignore this block
 ***/
<div _ibt="_DUMMY">

/***
 data bind, use _ibm, not _ibt!
 ***/
<span _ibm="_m.tbl.colA"></span> // [_m] model  -> page
<span _ibm="=m.tbl.colA"></span> // [=m] model <-> page
<span _ibm="~m.tbl.colA"></span> // [~m] model <-  page

<span _ibm="_m.tbl.colA[,attribute|innerHTML]"></span> // you can also specify an attribute.

when model is ARRAY, you can use [][+][n][<n] to control index.

/***************************
 * run on load             *
 ***************************
_ibt.onload() {    // run on document ready, define of _ibtRun function is not must.
  _ibt.reflect('#services', '/service/list', {searchCount: 20});
}

/***
 reflect data to page
 ***/
_ibt.m(modeldata).reflect(blockSelector);

_ibt.reflect(blockSelector, url, paramMap);
_ibt.reflect(blockSelector, url, paramMap, 'modelKeyToSetResponse', onErrorFunction)
_ibt.reflect(blockSelector, url, paramMap, functionToEditResponse(model, response), onErrorFunction)


/***
 _ibt.s("#div1").css()
 ***/
_ibt.s("#div1").css().add(str)
_ibt.s("#div1").css().remove(str)
_ibt.s("#div1").css().contains(str)

/***
 _ibt.S(".selected")
 ***/
uppercase to find all elements


/***
 message box
 ***/
var msgbox = _ibt.newMsgBox(selector, modelData)
var ibtMsgbox = msgbox.open();
ibtMsgbox.s("#closeBtn").onclick = function() {
  msgbox.close();
}

or just
_ibt.newMsgBox(selector, modelData).open("#closeBtn");

/***
 modal
 ***/
var modal = _ibt.newModal("/path/modal.html", {queryParam:"val"}, modelData);
var ibtModal = modal.open(); //also you can specify #closeBtn like open("#closeBtn")
ibtModal.s("#okBtn").onclick = function() {
  some logic
}

```
