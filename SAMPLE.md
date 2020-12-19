# ibt example  

##### functions of core  
```
_ibt.reflect(modelData, selector) //embed data to selector's content
_ibt.prepend(modelData, selector) //embed data and prepend to selector's content
_ibt.append(modelData, selector) //embed data and append to selector's content
_ibt.remove(selector) //remove element

_ibt.build(strHtml) //return function of html generator
_ibt.exttpl(url, queryMap) //call http and return html
_ibt.encode(strHtml) //encode html and embed to document when you need

```


##### extended functions  
```
_ibt.s(selector) //select Element
_ibt.S(selector) //select Elements
_ibt.s(selector).set()
_ibt.s(selector).get()
_ibt.s(selector).gets() //gather all children's value under current element
_ibt.s(selector).css()
_ibt.gets(keyAttr, valAttr) //gather all children's value of document, or current modal
_ibt.http(url, paramMap, onSuccess, onError) //http module

//define dataProcess function to process http result before rendering html.
//after rendering html postProcess function will be called, you can bind event here.
_ibt.reflectR(url, paramMap, selector, dataProcess, postProcess, onError) //embed http data to selector's content, R means Remote
_ibt.prependR(url, paramMap, selector, dataProcess, postProcess, onError) //embed http data and prepend to selector's content
_ibt.appendR(url, paramMap, selector, dataProcess, postProcess, onError) //embed http data and append to selector's content
_ibt.removeR(url, paramMap, selector, dataProcess, postProcess, onError) //remove element when http success

_ibt.show(visible) //show or hidden document, or modal
_ibt.processing() //show loading icon
_ibt.newMsgBox(selector, modelData) //create message box, specify selector to tell it is form of message box
_ibt.newModal(url, queryMap, modelData) //create modal, specify url to tell where to gets form of modal
```


##### example  
```
/***************************
 * description in the html *
 ***************************/
{{# some value #}} print [some value] as it is
{{@ some value @}} print encoded [some value]
{{% some javascript %}} run some javascript

/***
 display block only when the condition is true, [_m] is inputted model data
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
 data bind
 ***/
<span _ibtK="tbl.colA"></span> //see .get() and .gets() for more details

/***************************
 * run on load             *
 ***************************
_ibtRun() {    // run on document ready, define of _ibtRun function is not must.
  _ibt.reflectR("/path/service", {queryParam:"val"}, selector);
}

/***
 show form
 ***/
_ibt.reflect(modelData, sourceSelector) //display on the position of source
_ibt.reflect(modelData, sourceSelector, targetSelector) //display on the position of target
so on on prepend(), append(), remove(), reflectR(), prependR(), appendR(), removeR()

/***
 _ibt.s("#span1").get()
 ***/
<span id="span1" _ibtV="val1" _ibtVa="size" size="val2" value="val3">val4</span>
=>val1
<span id="span1" _ibtVa="size" size="val2" value="val3">val4</span>
=>val2
<span id="span1" size="val2" value="val3">val4</span>
=>val3
<span id="span1" size="val2">val4</span>
=>val4

/***
 _ibt.s("#span1").get("attrX")
 ***/
<span id="span1" _ibtV="val1" _ibtVa="size" size="val2" value="val3">val4</span>
=>undefined
<span id="span1" _ibtV="val1" _ibtVa="size" size="val2" value="val3" attrX="valX">val4</span>
=>valX

/***
 _ibt.s("#span1").set(val)
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
    <tr> <td _ibtK="tbl.col11">a_1</td> <td _ibtK="tbl.col2[]">b_1</td> <td _ibtK="tbl.col3[+].val1">c_1</td> </tr>
    <tr> <td _ibtK="tbl.col12">a_2</td> <td _ibtK="tbl.col2[]">b_2</td> <td _ibtK="tbl.col3[].val2" >c_2</td> </tr>
    <tr> <td _ibtK="tbl.col13">a_3</td> <td _ibtK="tbl.col2[]">b_3</td> <td _ibtK="tbl.col3[].val3" >c_3</td> </tr>

    <tr> <td _ibtK="tbl.col11">a_4</td> <td _ibtK="tbl.col2[]">b_4</td> <td _ibtK="tbl.col3[+].val1">c_4</td> </tr>
    <tr> <td _ibtK="tbl.col12">a_5</td> <td _ibtK="tbl.col2[]">b_5</td> <td _ibtK="tbl.col3[].val2" >c_5</td> </tr>
    <tr> <td _ibtK="tbl.col13">a_6</td> <td _ibtK="tbl.col2[]">b_6</td> <td _ibtK="tbl.col3[].val3" >c_6</td> </tr>
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
in the list type, you can move index cursor with symbol.
to next [+]
to previous [-]
or specify number [n]
in the plain list type, empty [] equals [+]

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
