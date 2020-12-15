# ibt
Is Boring Template engine?

## 概要:  
つまらなさそうなjavascriptテンプレートエンジン？  
意外とシンプルで使い勝手が良いかも知れません。  
ただただHTML画面表示したいだけなのに今風のエンジンは  
余計な概念がいっぱい入って学習コストが高い、面倒だと思われたことありませんか？  
###### 特徴  
  - if文で表示非表示、for文でリピートさせるだけのシンプルな仕組み 
  - デザイナーさんが折角作ったきれいなHTMLを最大限に保ったままで実行コードを入れることができる  
  - 純粋なjavascriptで実現しているため、他のLibrary必要なし  
  - 他のLibraryと相性が良い  
  - なんと言ってもシンプル、簡単！  
  
##### 機能一覧：  
_ibt.buildTpl(tplSelector)							テンプレート範囲指定。selectorは標準CSSセレクタをサポート  
_ibt.reflect(modelData, tplSelector, tarSelector)	データとtplSelectorのhtmlからtarSelectorに描画、tarSelector指定なしの場合はtplSelectorに  
_ibt.prepend(modelData, tplSelector, tarSelector)	描画結果をtarSelectorの先頭に追加  
_ibt.append(modelData, tplSelector, tarSelector)	描画結果をtarSelectorの後尾に追加  
_ibt.remove(tarSelector)							elementを削除  
_ibt.http(url, paramMap, onSuccess, onError)		HTTP通信モジュール  
  
##### 便利機能：  
_ibt.encode(strHtml) return String  
_ibt.build(strHtml) return Function				HTML描画関数作成  
_ibt.exttpl(url, queryMap) return String		外部HTML取得、HTTP同期通信  
_ibt.httpReflect(urlStr, paramMap, tplSelector, tarSelector, dataProcess, dataProcessOnErr)  
_ibt.httpPrepend(urlStr, paramMap, tplSelector, tarSelector, dataProcess, dataProcessOnErr)  
_ibt.httpAppend(urlStr, paramMap, tplSelector, tarSelector, dataProcess, dataProcessOnErr)  
_ibt.httpRemove(urlStr, paramMap, tarSelector, dataProcess, dataProcessOnErr)  
_ibt.showPage(visible)  
  
##### 例）HTML  
```
<div _ibt="if(_m.val1==_m.val2)">			=> 条件成立の場合のみ、表示。_m予約語、渡したmodelDataを指す
<div _ibt="if(_m.val1==_m.val2) continue | break">	=> loop内で条件成立の場合、次へまたは中断。※カレントdivは表示されない
<div _ibt="for(rowdata in _m.list)">			=> リピート表示
<div _ibt="for(var idx=0; idx<_m.list.length; idx++;)">	=> リピート表示
<div _ibt="for(var idx=0; idx<_m.list.length; idx++;) var row = _m.list[idx]">	=> 子供要素にて変数rowが使える
<div _ibt="exttpl('http://test.com/block1.html', {})">	=> 外部html templateを取得し、置き換える。共通template化可能
<div _ibt="_DUMMY">					=> _DUMMY予約語、templateから当該要素を対象外にする

<td>{{# _m.columnValue #}}</td>	  => {{# #}} そのまま表示
<td>{{@ _m.columnValue @}}</td>	  => {{@ @}} htmlEncodeして表示
                                     {{% %}} template(HTML)内部にてjavaScript記述、<tr><td>など子elementに記述する場合はコメント<!-- -->で囲む必要あり
                                              が！JAVASCRIPTエリアにて業務データ処理させ、templateではロジックはゴリゴリ書かない方が良いかと
```
##### 例） JAVASCRIPT  
```
_ibtRun = function() {    // run on document ready, _ibtRun定義は必須ではない。JQUERYの$(function(){ logic })などで起動してもよし  
	_ibt.buildTpl(selector);	// テンプレート指定、selector指定なしの場合は全ページ（<body>）  
	_ibt.buildTpl("#menu");		// 分割し、共通化  
	_ibt.buildTpl("#main");		// 分割し、モジュール化  
	_ibt.buildTpl("#block1");		// 巨大HTMLは分割することでレスポンスアップ  
	_ibt.reflect(modelData, "#main");	// 全部反映、modelDataを元に#mainをリフレッシュ  
	_ibt.prepend(modelData, "#dataList");	// 先頭追加  
	_ibt.append(modelData, 	"#dataList");	// 後尾追加  
	_ibt.reflect(modelData, "#stockNumber");// 部分反映、子要素指定、selectorピンポイント指定。  
}  
```
