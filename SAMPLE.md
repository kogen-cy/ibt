# ibt example  

##### functions of core  
```
_ibt.reflect(modelDataMap, selector) // embed data to selector's content
_ibt.prepend(modelDataMap, selector) // embed data and prepend selector's content
_ibt.append(modelDataMap, selector) // embed data and append selector's content
_ibt.remove(selector) // remove selector's content

_ibt.build(strHtml) // return function of html generator
_ibt.exttpl(url, queryMap) // call http and return html
_ibt.encode(strHtml) // encode html and embed to document when you need

```


##### extended functions  
```
_ibt.s(selector) // return Element
_ibt.S(selector) // return Elements
_ibt.gets(keyAttr, valAttr) // return all children's value under current element
_ibt.http(url, paramMap, onSuccess, onError) // http module
_ibt.reflectR(urlStr, paramMap, selector, dataProcess) // embed http data to selector's content. you can define dataProcess function to process http result before embed data.
_ibt.prependR(urlStr, paramMap, selector, dataProcess) // embed http data and prepend selector's content, R means Remote
_ibt.appendR(urlStr, paramMap, selector, dataProcess) // embed http data and append selector's content
_ibt.removeR(urlStr, paramMap, selector) // remove selector's content, when http success

_ibt.show(visible) // show or hidden document, or modal
_ibt.processing() // show loading icon
_ibt.newMsgBox(selector, modelData) // show message box, specify selector to tell it is form of message box
_ibt.newModal(url, queryMap, modelData) // show modal, specify url to tell where to gets form of modal
```


##### example  
```
/***
 describe in html
 ***/
{{# some value #}} print [some value] as it is
{{@ some value @}} print encoded [some value]
{{% some javascript %}} run some javascript

/***
 display block only when the condition is true, [_m] is inputted model data
 ***/
<div _ibt="if(_m.val1==_m.val2)">

/***
 continue or break to display when under loop. current block will not to be display
 ***/
<div _ibt="if(_m.val1==_m.val2) continue | break">

/***
 loop block
 ***/
<div _ibt="for(var idx in _m.list)">
<div _ibt="for(var idx=0; idx<_m.list.length; idx++;)">

/***
 loop with some logic, in this case the [row] can be used in child elements
 ***/
<div _ibt="for(var idx=0; idx<_m.list.length; idx++;) var row=_m.list[idx]">

/***
 load remote html
 ***/
<div _ibt="exttpl('/path/block1.html', {queryParam:'val'})">

/***
 ignore this block
 ***/
<div _ibt="_DUMMY">

/***
 data bind
 ***/
<span _ibtK="tbl.colA"></span>
see get() and gets() for details

/***
 run on load
/***
_ibtRun() {    // run on document ready, _ibtRun define is not must.
  _ibt.reflect(modelDataMap, templateSelector, targetSelector);
}

/***
 show form
 ***/
_ibt.reflect(modelDataMap, sourceSelector) display on the position of source
_ibt.reflect(modelDataMap, sourceSelector, targetSelector) display on the position of target

/***
 _ibt.s("#div1").get()
 ***/
<div id="div1" _ibtV="val1" _ibtVa="size" size="val2" value="val3">val4</div>
=>val1
<div id="div1" _ibtVa="size" size="val2" value="val3">val4</div>
=>val2
<div id="div1" size="val2" value="val3">val4</div>
=>val3
<div id="div1" size="val2">val4</div>
=>val4

/***
 _ibt.s("#div1").get("attrX")
 ***/
<div id="div1" _ibtV="val1" _ibtVa="size" size="val2" value="val3">val4</div>
=>undefined
<div id="div1" _ibtV="val1" _ibtVa="size" size="val2" value="val3" attrX="valX">val4</div>
=>valX

/***
 _ibt.s("#div1").set(val)
 ***/
the priority of setting value same as .get()

/***
 _ibt.gets()
 ***/
gather all value of document, or current modal

/***
 _ibt.s("#div1").gets()
 ***/
<div id="div1">
  <table>
    <tr><td _ibtK="tbl.col11">a_1</td><td _ibtK="tbl.col2[]">b_1</td><td _ibtK="tbl.col3[+].val1">c_1</td></tr>
    <tr><td _ibtK="tbl.col12">a_2</td><td _ibtK="tbl.col2[]">b_2</td><td _ibtK="tbl.col3[].val2" >c_2</td></tr>
    <tr><td _ibtK="tbl.col13">a_3</td><td _ibtK="tbl.col2[]">b_3</td><td _ibtK="tbl.col3[].val3" >c_3</td></tr>

    <tr><td _ibtK="tbl.col11">a_4</td><td _ibtK="tbl.col2[]">b_4</td><td _ibtK="tbl.col3[+].val1">c_4</td></tr>
    <tr><td _ibtK="tbl.col12">a_5</td><td _ibtK="tbl.col2[]">b_5</td><td _ibtK="tbl.col3[].val2" >c_5</td></tr>
    <tr><td _ibtK="tbl.col13">a_6</td><td _ibtK="tbl.col2[]">b_6</td><td _ibtK="tbl.col3[].val3" >c_6</td></tr>
  </table>
  <input type="text" _ibtK="user" value="kogen-cy">
<div>
=>
{
  tbl:{
    col11: 'a_4',
    col12: 'a_5',
    col13: 'a_6',
    col2: ['b_1', 'b_2', 'b_3', 'b_4', 'b_5', 'b_6'],
    col3: [
      {val1:'c_1', val2:'c_2', val3:'c_3'},
      {val1:'c_4', val2:'c_5', val3:'c_6'}
    ],
  }
  user: 'kogen-cy'
}

/***
 _ibt.s("#div1").css()
 ***/
_ibt.s("#div1").css().add(str)
_ibt.s("#div1").css().remove(str)

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
msgbox.open("#closeBtn");

/***
 modal
 ***/
var modal = _ibt.newModal("/path/modal.html", {queryParam:"val"}, modelData);
var ibtModal = modal.open();
ibtModal.s("#okBtn").onclick = function() {
  some logic
}
ibtModal.s("#closeBtn").onclick = function() { // same as modal.open("#closeBtn");
  modal.close();
}


```
