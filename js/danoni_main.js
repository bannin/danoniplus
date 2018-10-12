﻿/**
 * Dancing☆Onigiri
 * Ver 0.1.10
 * 
 * Source by tickle
 * created : 2018/10/08
 * Revised : 2018/10/12
 */

/**
 * ▽ ソースコーディングルール
 * - 定数・変数名はわかりやすく、名前で判断がつくように。
 * -- 定数　　　： "C_(カテゴリ)_(名前)"の形式。全て英大文字、数字、アンダースコアのみを使用。
 * -- 関数の引数： アンダースコア始まりのキャメル表記。
 * 
 * - 構造はシンプルに。繰り返しが多いときは関数化を検討する。
 * - コメントは処理単位ごとに簡潔に記述。ただの英訳は極力避ける。
 * - 画面の見取りがわかるように詳細設定やロジックは別関数化し、実行内容を明確にする。
 * 
 * 
 * ▽ 画面の構成
 *  [タイトル]-[オプション]-[キーコンフィグ]-[譜面読込]-[メイン]-[リザルト]
 *  ⇒　各画面に Init がついたものが画面の基本構成(ルート)を表す。
 * 
 * ▽ レイヤーの考え方
 *  [マスク]-[メイン]-[背景]の3層を想定。
 *  ここで指定するものは基本的に中間の[メイン]に配置する。
 *  [背景]や[マスク]層はカスタムしやすいようにする予定。
 * 
 * ▽ スプライトの親子関係
 *  基本的にdiv要素で管理。最下層を[difRoot]とし、createSplite()でdiv子要素を作成していく。
 *  clearWindow()で[difRoot]以外の全てのスプライトを削除できる。
 *  特定のスプライトに限り削除する場合は deleteChildSpliteAll() で実現。
 */

window.onload = function(){
	titleInit();
}

/**
 * 汎用定数定義
 */
// 表示位置
var C_ALIGN_LEFT = "left";
var C_ALIGN_CENTER = "center";
var C_ALIGN_RIGHT = "right";
var C_VALIGN_TOP = "top";
var C_VALIGN_MIDDLE = "middle";
var C_VALIGN_BOTTOM = "bottom";

// ユーザインタフェース
var C_CLR_DEFAULT = "#333333";
var C_CLR_DEFHOVER = "#666666";
var C_CLR_BACK = "#000033";
var C_CLR_NEXT = "#330000";
var C_CLR_SETTING = "#333300";
var C_CLR_RESET = "#003300";
var C_CLR_TWEET = "#003333";
var C_CLR_TEXT = "#ffffff";
var C_CLR_TITLE = "#cccccc";

var C_LBL_TITLESIZE = 32;
var C_LBL_BTNSIZE = 28;
var C_LBL_LNKSIZE = 16;
var C_LBL_BASICFONT = "Meiryo UI";

var C_CLR_LNK = "#111111";
var C_BTN_HEIGHT = 50;
var C_LNK_HEIGHT = 20;

// スプライト（ムービークリップ相当）のルート
var C_SPLITE_ROOT = "divRoot";

// 譜面データ持ち回り用
var rootObj = {};
var headerObj = {};
var scoreObj = {};
var stateObj = {
	scoreId: 0,
	speed: 3.5,
	motion: "OFF",
	reverse: "OFF",
	auto: "OFF",
	adjustment: 0
};

/**
 * イベントハンドラ用オブジェクト
 * 参考: http://webkatu.com/remove-eventlistener/
 * 
 * - イベントリスナー作成時にリスナーキー(key)を発行する
 * - 削除時は発行したリスナーキーを指定して削除する
 */
var handler = (function(){
	var events = {},
	key = 0;

	return {
		addListener: function(_target, _type, _listener, _capture) {
			if(window.addEventListener){
				_target.addEventListener(_type, _listener, _capture);
			}else if(window.attachEvent){
				_target.attachment('on' + _type, _listener);
			}
			events[key] = {
				target: _target,
				type: _type,
				listener: _listener,
				capture: _capture
			};
			return key++;
		},
		removeListener: function(key){
			if(key in events){
				var e = events[key];
				if(window.removeEventListener){
					e.target.removeEventListener(e.type, e.listener, e.capture);
				}else if(window.detachEvent){
					e.target.detachEvent('on' + e.type, e.listener);
				}
			}
		}
	}
})();

/**
 * 図形の描画
 * - div子要素の作成。呼び出しただけでは使用できないので、親divよりappendChildすること。
 * - 詳細は @see {@link createButton} も参照のこと。 
 * @param {string} _id
 * @param {number} _x 
 * @param {number} _y 
 * @param {number} _width 
 * @param {number} _height 
 */
function createDiv(_id, _x, _y, _width, _height){
	var div = document.createElement("div");
	div.id = _id;
	div.style.left   = _x + "px";
	div.style.top    = _y + "px";
	div.style.width  = _width + "px";
	div.style.height = _height + "px";
	div.style.position = "absolute";

	div.style.userSelect = "none";
	div.style.webkitUserSelect = "none";
	div.style.msUserSelect = "none";
	div.style.mozUserSelect = "none";
	div.style.khtmlUserSelect = "none";
	div.style.webkitTouchCallout = "none";

	return div;
}

/**
 * 子div要素のラベル文字作成
 * - ここで指定するテキストはhtmlタグが使える
 * @param {string} _id 
 * @param {number} _x 
 * @param {number} _y 
 * @param {number} _width 
 * @param {number} _height 
 * @param {number} _fontsize 
 * @param {string} _color
 * @param {string} _text 
 */
function createDivLabel(_id, _x, _y, _width, _height, _fontsize, _color, _text){
	var div = createDiv(_id, _x, _y, _width, _height);
	div.style.font = _fontsize + "px '" + C_LBL_BASICFONT + "'";
	div.style.color = _color;
	div.innerHTML = _text;

	return div;
}

/**
 * 空スプライト(ムービークリップ相当)の作成
 * - 作成済みの場合はすでに作成済のスプライトを返却する
 * - ここで作成したスプライトは clearWindow() により削除される
 * @param {string} _parentObjName 親スプライト名
 * @param {string} _newObjName 作成する子スプライト名
 * @param {number} _x 作成するスプライトのx座標（親スプライト基準）
 * @param {number} _y 作成するスプライトのy座標（親スプライト基準）
 * @param {number} _width 幅
 * @param {number} _height 高さ
 */
function createSplite(_parentObjName, _newObjName, _x, _y, _width, _height){
	if(document.getElementById(_newObjName) == null){
		var parentSplite = document.getElementById(_parentObjName);
		var newSplite = createDiv(_newObjName, _x, _y, _width, _height);
		parentSplite.appendChild(newSplite);
	}else{
		var newSplite = document.getElementById(_newObjName);
	}
	return newSplite;
}

/**
 * 親スプライト配下の子スプライトを全削除
 * @param {object} _parentObjName 親スプライト名
 */
function deleteChildSpliteAll(_parentObjName){

	var parentSplite = document.getElementById(_parentObjName);
	while (parentSplite.hasChildNodes()){
		handler.removeListener(parentSplite.firstChild.getAttribute("lsnrkey"));
		handler.removeListener(parentSplite.firstChild.getAttribute("lsnrkeyTS"));
		handler.removeListener(parentSplite.firstChild.getAttribute("lsnrkeyTE"));
		parentSplite.removeChild(parentSplite.firstChild);
	}
}

/**
 * ボタンの作成
 * - ボタンの位置、色といった基本設定をここで指定
 * - 実際のボタンは以下のように設定して使用すること（表示されなくなる）
 * - ボタンの表示テキスト及びフォントは固定
 * 
 * -  使い方：
 *		var btnBack = createButton({
 *			// ボタンオブジェクト名
 *			id: "btnBack",
 *			// ボタンに表示する名前
 *			name: "Back",
 *			// 作成先のx座標 (appendChildする親に対する位置)
 *			x: 0,
 *			// 作成先のy座標 (appendChildする親に対する位置)
 *			y: sHeight-100,
 *			// 幅
 *			width: sWidth/3, 
 *			// 高さ
 *			height: C_BTN_HEIGHT, 
 *			// フォントサイズ
 *			fontsize: C_LBL_BTNSIZE,
 *			// 通常時の背景色 (カラーコード:#ffffff 形式)
 *			normalColor: C_CLR_DEFAULT, 
 *			// オンマウス時の背景色 (カラーコード:#ffffff 形式)
 *			hoverColor: C_CLR_BACK, 
 *			// 表示位置
 *			align: C_ALIGN_CENTER
 *		}, function(){
 *			// ボタン押下後の処理
 *			clearWindow();
 *			titleInit();
 *		});
 *		divRoot.appendChild(btnBack);
 *   
 * @param {object} _obj ボタンオブジェクト
 * @param {function} _func ボタン押下後の処理（マウスハンドラ）
 */
function createButton(_obj, _func){

	// ボタン用の子要素divを作成
	var div = createDiv(_obj.id, _obj.x, _obj.y, _obj.width, _obj.height);

	// ボタンの装飾を定義
	div.style.font = _obj.fontsize + "px '" + C_LBL_BASICFONT + "'";
	div.innerHTML = _obj.name;
	div.style.textAlign = _obj.align;
	div.style.verticalAlign = C_VALIGN_MIDDLE;
	div.style.color = C_CLR_TEXT;
	div.style.backgroundColor = _obj.normalColor;

	// オンマウス・タップ時の挙動 (背景色変更、カーソル変化)
	div.onmouseover = function(){
		div.style.backgroundColor = _obj.hoverColor;
		div.style.cursor = "pointer";
	}
	var lsnrkeyTS = handler.addListener(div, "touchstart", function(){
		div.style.backgroundColor = _obj.hoverColor;
		div.style.cursor = "pointer";
	}, false);

	// 通常時の挙動 (背景色変更、カーソル変化)
	div.onmouseout = function(){
		div.style.backgroundColor = _obj.normalColor;
		div.style.cursor = "default";
	}
	var lsnrkeyTE = handler.addListener(div, "touchend", function(){
		div.style.backgroundColor = _obj.normalColor;
		div.style.cursor = "default";
	}, false);

	// ボタンを押したときの動作
	var lsnrkey = handler.addListener(div, "click", function(){
		_func();
	}, false);

	// イベントリスナー用のキーをセット
	div.setAttribute("lsnrkey",lsnrkey);
	div.setAttribute("lsnrkeyTS",lsnrkeyTS);
	div.setAttribute("lsnrkeyTE",lsnrkeyTE);
	
	return div;
}

/**
 * ラベル文字作成（レイヤー直書き。htmlタグは使用できない）
 * @param {string} _ctx ラベルを作成する場所のコンテキスト名
 * @param {string} _text 表示するテキスト
 * @param {number} _x 作成先のx座標
 * @param {number} _y 作成先のy座標
 * @param {number} _fontsize フォントサイズ
 * @param {number} _fontname フォント名
 * @param {string} _color 色 (カラーコード:#ffffff 形式 or グラデーション)
 * @param {string} _align テキストの表示位置 (left, center, right)
 */
function createLabel(_ctx, _text, _x, _y, _fontsize, _fontname, _color, _align){
	_ctx.font = _fontsize + "px '"+ _fontname +"'";
	_ctx.textAlign = _align;
	_ctx.fillStyle = _color;
	_ctx.fillText(_text, _x, _y);
}

/**
 * タイトル文字描画
 * @param {string} _id 
 * @param {string} _titlename 
 * @param {number} _x 
 * @param {number} _y 
 */
function getTitleDivLabel(_id, _titlename, _x, _y){
	var div = createDivLabel(_id, _x, _y, 500, 50, C_LBL_BTNSIZE, C_CLR_TITLE, _titlename);
	div.style.align = C_ALIGN_CENTER;
	return div;
}

/**
 * 画面上の描画、オブジェクトを全てクリア
 * - divオブジェクト(ボタンなど)はdivRoot配下で管理しているため、子要素のみを全削除している。
 * - dicRoot自体を削除しないよう注意すること。
 * - 再描画時に共通で表示する箇所はここで指定している。
 */
function clearWindow(){

	// レイヤー情報取得
	var layer0 = document.getElementById("layer0");
	var l0ctx = layer0.getContext("2d");
	var layer1 = document.getElementById("layer1");
	var l1ctx = layer1.getContext("2d");
	var layer2 = document.getElementById("layer2");
	var l2ctx = layer2.getContext("2d");
	var sWidth = layer0.width;
	var sHeight = layer0.height;
	var C_MARGIN = 10;

	// 線画、図形をクリア
	l0ctx.clearRect(0,0,sWidth,sHeight);
	l1ctx.clearRect(0,0,sWidth,sHeight);
	l2ctx.clearRect(0,0,sWidth,sHeight);

	// ボタン、オブジェクトをクリア (divRoot配下のもの)
	var divRoot = document.getElementById("divRoot");
	while (divRoot.hasChildNodes()){
		/*
		alert(divRoot.firstChild.getAttribute("lsnrkey"));
		*/
		handler.removeListener(divRoot.firstChild.getAttribute("lsnrkey"));
		handler.removeListener(divRoot.firstChild.getAttribute("lsnrkeyTS"));
		handler.removeListener(divRoot.firstChild.getAttribute("lsnrkeyTE"));
		divRoot.removeChild(divRoot.firstChild);
	}

	// 画面背景を指定 (background-color)
	var grd = l1ctx.createLinearGradient(0,0,0,sHeight);
	grd.addColorStop(0, "#000000");
	grd.addColorStop(1, "#222222");
	l1ctx.fillStyle=grd;
	l1ctx.fillRect(0,0,sHeight,sHeight);

	// 線画 (title-line)
	l1ctx.beginPath();
	l1ctx.strokeStyle="#cccccc";
	l1ctx.moveTo(C_MARGIN,C_MARGIN);
	l1ctx.lineTo(sHeight-C_MARGIN,C_MARGIN);
	l1ctx.stroke();
	
	l1ctx.beginPath();
	l1ctx.strokeStyle="#cccccc";
	l1ctx.moveTo(C_MARGIN,sHeight-C_MARGIN);
	l1ctx.lineTo(sHeight-C_MARGIN,sHeight-C_MARGIN);
	l1ctx.stroke();
	
}

/*-----------------------------------------------------------*/

/**
 *  タイトル画面初期化
 */
function titleInit(){

	// レイヤー情報取得
	var layer0 = document.getElementById("layer0");
	var l0ctx = layer0.getContext("2d");
	var layer1 = document.getElementById("layer1");
	var l1ctx = layer1.getContext("2d");
	var layer2 = document.getElementById("layer2");
	var l2ctx = layer2.getContext("2d");
	var sWidth = layer0.width;
	var sHeight = layer0.height;

	if(document.getElementById("divRoot") == null){
		var stage = document.getElementById("canvas-frame");
		var divRoot = createDiv("divRoot",0,0,sWidth,sHeight);
		stage.appendChild(divRoot);
		clearWindow();
	}else{
		var divRoot = document.getElementById("divRoot");
	}
	
	// タイトル文字描画
	var lblTitle = getTitleDivLabel("lblTitle", 
	"<span style='color:#6666ff;font-size:40px;'>D</span>ANCING<span style='color:#ffff66;font-size:40px;'>☆</span><span style='color:#ff6666;font-size:40px;'>O</span>NIGIRI", 0, 15);
	divRoot.appendChild(lblTitle);

	// ボタン描画
	var btnStart = createButton({
		id: "btnStart", 
		name: "Click Here!!", 
		x: 0, 
		y: sHeight-100, 
		width: sWidth, 
		height: C_BTN_HEIGHT, 
		fontsize: C_LBL_TITLESIZE,
		normalColor: C_CLR_DEFAULT, 
		hoverColor: C_CLR_DEFHOVER, 
		align: C_ALIGN_CENTER
	}, function(){
		clearWindow();
		optionInit();
	});
	divRoot.appendChild(btnStart);

	// 譜面データの読み込み
	var dos = document.getElementById("dos").value;
	rootObj = dosConvert(dos);
	headerObj = headerConvert(rootObj);

	// 曲名文字描画（曲名は譜面データから取得）
	// TEST:試験的に矢印色の1番目と3番目を使ってタイトルをグラデーション
	var grd = l1ctx.createLinearGradient(0,0,sHeight,0);
	if(headerObj["setColor"][0]!=undefined){
		grd.addColorStop(0, headerObj["setColor"][0]);
	}else{
		grd.addColorStop(0, "#ffffff");
	}
	if(headerObj["setColor"][2]!=undefined){
		grd.addColorStop(1, headerObj["setColor"][2]);
	}else{
		grd.addColorStop(1, "#66ffff");
	}
	var titlefontsize = 64 * (12 / headerObj["musicTitle"].length);
	createLabel(l1ctx, headerObj["musicTitle"], sWidth/2, sHeight/2, 
		titlefontsize, "Century Gothic", grd, C_ALIGN_CENTER);

	// 製作者表示
	var lnkMaker = createButton({
		id: "lnkMaker", 
		name: "Maker: "+ headerObj["tuning"], 
		x: 20, 
		y: sHeight-40, 
		width: sWidth/2-10, 
		height: C_LNK_HEIGHT, 
		fontsize: C_LBL_LNKSIZE,
		normalColor: C_CLR_LNK, 
		hoverColor: C_CLR_DEFAULT, 
		align: C_ALIGN_LEFT
	}, function(){
		window.open(headerObj["creatorUrl"], '_blank');
	});
	divRoot.appendChild(lnkMaker);

	// 作曲者リンク表示
	var lnkArtist = createButton({
		id: "lnkArtist", 
		name: "Artist: " + headerObj["artistName"], 
		x: sWidth/2, 
		y: sHeight-40, 
		width: sWidth/2-10, 
		height: C_LNK_HEIGHT, 
		fontsize: C_LBL_LNKSIZE,
		normalColor: C_CLR_LNK, 
		hoverColor: C_CLR_DEFAULT, 
		align: C_ALIGN_LEFT
	}, function(){
		window.open(headerObj["artistUrl"], '_blank');
	});
	divRoot.appendChild(lnkArtist);

	
}

/**
 * 譜面データを分割して値を取得
 * @param {string} _dos 譜面データ
 */
function dosConvert(_dos){

	var obj = {};
	var params = _dos.split("&");
	for(var j=0; j<params.length; j++){
		var pos = params[j].indexOf("=");
		if(pos > 0){
			var pKey = params[j].substring(0,pos);
			var pValue = params[j].substring(pos+1);
			if(pKey != undefined){
				obj[pKey] = pValue;
			}
		}
	}
	return obj;
}

/**
 * 譜面ヘッダーの分解
 * @param {object} _dosObj 譜面データオブジェクト
 */
function headerConvert(_dosObj){

	// ヘッダー群の格納先
	var obj = {};

	// 曲名
	var musics = _dosObj["musicTitle"].split(",");
	obj["musicTitle"] = musics[0];
	obj["artistName"] = musics[1];
	obj["artistUrl"]  = musics[2];

	// 譜面情報
	var difs = _dosObj["difData"].split("$");
	obj["keyLabels"] = new Array();
	obj["difLabels"] = new Array();
	obj["initSpeeds"] = new Array();
	for(var j=0; j<difs.length; j++){
		var difDetails = difs[j].split(",");
		obj["keyLabels"].push(difDetails[0]);
		obj["difLabels"].push(difDetails[1]);
		obj["initSpeeds"].push(difDetails[2]);
	}
	// 初期色情報
	obj["setColor"] = _dosObj["setColor"].split(",");
	for(var j=0; j<obj["setColor"].length; j++){
		obj["setColor"][j] = obj["setColor"][j].replace("0x","#");
	}

	// 製作者表示
	var tunings = _dosObj["tuning"].split(",");
	obj["tuning"] = tunings[0];
	obj["creatorUrl"] = tunings[1];

	// TODO:フリーズアロー色など他のヘッダー情報の分解

	return obj;
}

/**
 * 譜面データの分解
 * @param {object} _dosObj 
 * @param {string} _scoreNo
 */
function scoreConvert(_dosObj, _keys, _scoreNo){

	// 矢印群の格納先
	var obj = {};

	var speedFooter = (_keys == "5" ? "_data" : "_change");
	if(_dosObj["speed_" + _scoreNo + speedFooter] != undefined){
		obj["speed_data"] = _dosObj["speed_" + _scoreNo + speedFooter].split(",");
	}
	if(_dosObj["boost_" + _scoreNo + "data"] != undefined){
		obj["boost_data"] = _dosObj["boost_" + _scoreNo + "data"].split(",");
	}
	if(_dosObj["color_" + _scoreNo + "data"] != undefined){
		obj["color_data"] = _dosObj["color_" + _scoreNo + "data"].split(",");
	}
	if(_dosObj["acolor_" + _scoreNo + "data"] != undefined){
		obj["acolor_data"] = _dosObj["acolor_" + _scoreNo + "data"].split(",");
	}

	return obj;
}

/*-----------------------------------------------------------*/

/**
 * オプション画面初期化
 */
function optionInit(){

	// レイヤー情報取得
	var layer0 = document.getElementById("layer0");
	var l1ctx = layer0.getContext("2d");
	var layer1 = document.getElementById("layer1");
	var l1ctx = layer1.getContext("2d");
	var layer2 = document.getElementById("layer2");
	var l2ctx = layer2.getContext("2d");
	var sWidth = layer0.width;
	var sHeight = layer0.height;
	var divRoot = document.getElementById("divRoot");
	var stage = document.getElementById("canvas-frame");

	// タイトル文字描画
	var lblTitle = getTitleDivLabel("lblTitle", 
	"<span style='color:#6666ff;font-size:40px;'>O</span>PTION", 0, 15);
	divRoot.appendChild(lblTitle);

	// オプションボタン用の設置
	createOptionWindow("divRoot");

	// 戻るボタン描画
	var btnBack = createButton({
		id: "btnBack", 
		name: "Back", 
		x: 0, 
		y: sHeight-100, 
		width: sWidth/3, 
		height: C_BTN_HEIGHT, 
		fontsize: C_LBL_BTNSIZE,
		normalColor: C_CLR_DEFAULT, 
		hoverColor: C_CLR_BACK, 
		align: C_ALIGN_CENTER
	}, function(){
		// タイトル画面へ戻る
		clearWindow();
		titleInit();
	});
	divRoot.appendChild(btnBack);

	// キーコンフィグボタン描画
	var btnKeyConfig = createButton({
		id: "btnKeyConfig", 
		name: "KeyConfig", 
		x: sWidth/3, 
		y: sHeight-100, 
		width: sWidth/3, 
		height: C_BTN_HEIGHT, 
		fontsize: C_LBL_BTNSIZE,
		normalColor: C_CLR_DEFAULT, 
		hoverColor: C_CLR_SETTING, 
		align: C_ALIGN_CENTER
	}, function(){
		// キーコンフィグ画面へ遷移
		clearWindow();
		keyConfigInit();
	});
	divRoot.appendChild(btnKeyConfig);
	
	// 進むボタン描画
	var btnPlay = createButton({
		id: "btnPlay", 
		name: "Play", 
		x: sWidth/3 * 2, 
		y: sHeight-100, 
		width: sWidth/3, 
		height: C_BTN_HEIGHT, 
		fontsize: C_LBL_BTNSIZE,
		normalColor: C_CLR_DEFAULT, 
		hoverColor: C_CLR_NEXT, 
		align: C_ALIGN_CENTER
	}, function(){
		clearWindow();
		loadingScoreInit();
	});
	divRoot.appendChild(btnPlay);
}


/**
 * オプション画面のラベル・ボタン処理の描画
 * @param {Object} _splite 基準とするスプライト(ここで指定する座標は、そのスプライトからの相対位置)
 */
function createOptionWindow(_splite){

	// 各ボタン用のスプライトを作成
	var optionSplite = createSplite(_splite, "optionSplite", 50, 100, 400, 300);

	// 難易度(Difficulty)
	var lblDifficulty = createDivLabel("lblDifficulty", 0, 0, 100, 30, 20, C_CLR_TITLE, 
					"<span style='color:#ff9999'>D</span>ifficulty");
	optionSplite.appendChild(lblDifficulty);

	var lnkDifficulty = createButton({
		id: "lnkDifficulty", 
		name: headerObj["keyLabels"][stateObj.scoreId] + " key / " + headerObj["difLabels"][stateObj.scoreId], 
		x: 170, 
		y: 0, 
		width: 250, 
		height: 30, 
		fontsize: 20,
		normalColor: C_CLR_LNK, 
		hoverColor: C_CLR_DEFAULT, 
		align: C_ALIGN_CENTER
	}, function(){
		// 難易度変更ボタン押下時は譜面名及び初期速度を変更
		stateObj.scoreId = (stateObj.scoreId < headerObj["keyLabels"].length-1 ? ++stateObj.scoreId : 0);
		lnkDifficulty.innerHTML = headerObj["keyLabels"][stateObj.scoreId] + " key / " + headerObj["difLabels"][stateObj.scoreId];
		stateObj.speed = headerObj["initSpeeds"][stateObj.scoreId];
		lnkSpeed.innerHTML = stateObj.speed + " x";
	});
	optionSplite.appendChild(lnkDifficulty);

	// 速度(Speed)
	var lblSpeed = createDivLabel("lblSpeed", 0, 30, 100, 30, 20, C_CLR_TITLE, 
				"<span style='color:#ff9977'>S</span>peed");
	optionSplite.appendChild(lblSpeed);
	var lnkSpeed = createButton({
		id: "lnkSpeed", 
		name: stateObj.speed + " x", 
		x: 170, 
		y: 30, 
		width: 250, 
		height: 30, 
		fontsize: 20,
		normalColor: C_CLR_LNK, 
		hoverColor: C_CLR_DEFAULT, 
		align: C_ALIGN_CENTER
	}, function(){
		stateObj.speed = (Number(stateObj.speed) < 10 ? Number(stateObj.speed) + 0.25 : 1);
		lnkSpeed.innerHTML = stateObj.speed + " x";
	});
	optionSplite.appendChild(lnkSpeed);

	// 速度モーション (Motion)
	var lblMotion = createDivLabel("lblMotion", 0, 60, 100, 30, 20, C_CLR_TITLE, 
				"<span style='color:#ffff66'>M</span>otion");
	optionSplite.appendChild(lblMotion);
	var lnkMotion = createButton({
		id: "lnkMotion", 
		name: stateObj.motion, 
		x: 170, 
		y: 60, 
		width: 250, 
		height: 30, 
		fontsize: 20,
		normalColor: C_CLR_LNK, 
		hoverColor: C_CLR_DEFAULT, 
		align: C_ALIGN_CENTER
	}, function(){
		switch(stateObj.motion){
			case "OFF": 
				stateObj.motion = "Boost";	break;
			case "Boost":
				stateObj.motion = "Brake";	break;
			case "Brake":
				stateObj.motion = "OFF";	break;
		}
		lnkMotion.innerHTML = stateObj.motion;
	});
	optionSplite.appendChild(lnkMotion);

	// リバース
	var lblReverse = createDivLabel("lblReverse", 0, 90, 100, 30, 20, C_CLR_TITLE, 
				"<span style='color:#66ffff'>R</span>everse");
	optionSplite.appendChild(lblReverse);
	var lnkReverse = createButton({
		id: "lnkReverse", 
		name: stateObj.reverse, 
		x: 170, 
		y: 90, 
		width: 250, 
		height: 30, 
		fontsize: 20,
		normalColor: C_CLR_LNK, 
		hoverColor: C_CLR_DEFAULT, 
		align: C_ALIGN_CENTER
	}, function(){
		stateObj.reverse = (stateObj.reverse == "OFF" ? "ON" : "OFF");
		lnkReverse.innerHTML = stateObj.reverse;
	});
	optionSplite.appendChild(lnkReverse);

	// 鑑賞モード設定 (AutoPlay)
	var lblAutoPlay = createDivLabel("lblAutoPlay", 0, 120, 100, 30, 20, C_CLR_TITLE, 
				"<span style='color:#999999'>A</span>utoPlay");
	optionSplite.appendChild(lblAutoPlay);
	var lnkAutoPlay = createButton({
		id: "lnkAutoPlay", 
		name: stateObj.auto, 
		x: 170, 
		y: 120, 
		width: 250, 
		height: 30, 
		fontsize: 20,
		normalColor: C_CLR_LNK, 
		hoverColor: C_CLR_DEFAULT, 
		align: C_ALIGN_CENTER
	}, function(){
		stateObj.auto = (stateObj.auto == "OFF" ? "ON" : "OFF");
		lnkAutoPlay.innerHTML = stateObj.auto;
	});
	optionSplite.appendChild(lnkAutoPlay);

	// タイミング調整 (Adjustment)
	var lblAdjustment = createDivLabel("lblAdjustment", 0, 150, 100, 30, 20, C_CLR_TITLE, 
				"<span style='color:#cc66ff'>A</span>djustment");
	optionSplite.appendChild(lblAdjustment);
	var lnkAdjustment = createButton({
		id: "lnkAutoPlay", 
		name: stateObj.adjustment, 
		x: 170, 
		y: 150, 
		width: 250, 
		height: 30, 
		fontsize: 20,
		normalColor: C_CLR_LNK, 
		hoverColor: C_CLR_DEFAULT, 
		align: C_ALIGN_CENTER
	}, function(){
		stateObj.adjustment = (stateObj.adjustment == 15 ? -15 : ++stateObj.adjustment);
		lnkAdjustment.innerHTML = stateObj.adjustment;
	});
	optionSplite.appendChild(lnkAdjustment);

}

/*-----------------------------------------------------------*/

/**
 * キーコンフィグ画面初期化
 */
function keyConfigInit(){

	// レイヤー情報取得
	var layer0 = document.getElementById("layer0");
	var l0ctx = layer0.getContext("2d");
	var layer1 = document.getElementById("layer1");
	var l1ctx = layer1.getContext("2d");
	var layer2 = document.getElementById("layer2");
	var l2ctx = layer2.getContext("2d");
	var sWidth = layer0.width;
	var sHeight = layer0.height;
	var divRoot = document.getElementById("divRoot");

	// タイトル文字描画
	var lblTitle = getTitleDivLabel("lblTitle", 
	"<span style='color:#6666ff;font-size:40px;'>K</span>EY<span style='color:#ff6666;font-size:40px;'>C</span>ONFIG", 0, 15);
	divRoot.appendChild(lblTitle);

	// 戻るボタン描画
	var btnBack = createButton({
		id: "btnBack", 
		name: "Back", 
		x: 0, 
		y: sHeight-100, 
		width: sWidth/2, 
		height: C_BTN_HEIGHT, 
		fontsize: C_LBL_BTNSIZE,
		normalColor: C_CLR_DEFAULT, 
		hoverColor: C_CLR_BACK, 
		align: C_ALIGN_CENTER
	}, function(){
		// オプション画面へ戻る
		clearWindow();
		optionInit();
	});
	divRoot.appendChild(btnBack);
	
	// キーコンフィグリセットボタン描画
	var btnReset = createButton({
		id: "btnReset", 
		name: "Reset", 
		x: sWidth/2, 
		y: sHeight-100, 
		width: sWidth/2, 
		height: C_BTN_HEIGHT, 
		fontsize: C_LBL_BTNSIZE,
		normalColor: C_CLR_DEFAULT, 
		hoverColor: C_CLR_RESET, 
		align: C_ALIGN_CENTER
	}, function(){
		// TODO:キーコンフィグリセット
	});
	divRoot.appendChild(btnReset);
}

/*-----------------------------------------------------------*/

/**
 * 読込画面初期化
 */
function loadingScoreInit(){

	// レイヤー情報取得
	var layer0 = document.getElementById("layer0");
	var l0ctx = layer0.getContext("2d");
	var layer1 = document.getElementById("layer1");
	var l1ctx = layer1.getContext("2d");
	var layer2 = document.getElementById("layer2");
	var l2ctx = layer2.getContext("2d");
	var sWidth = layer0.width;
	var sHeight = layer0.height;
	var divRoot = document.getElementById("divRoot");

	// 譜面データの読み込み
	var scoreIdHeader = "";
	if(stateObj.scoreId > 0){
		scoreIdHeader = Number(stateObj.scoreId) + 1;
	}
	scoreObj = scoreConvert(rootObj, headerObj["keyLabels"][stateObj.scoreId], scoreIdHeader);


	// 戻るボタン描画 (本来は不要だがデバッグ用に作成)
	var btnBack = createButton({
		id: "btnBack", 
		name: "Back", 
		x: 0, 
		y: sHeight-100, 
		width: sWidth/2, 
		height: C_BTN_HEIGHT, 
		fontsize: C_LBL_BTNSIZE,
		normalColor: C_CLR_DEFAULT, 
		hoverColor: C_CLR_BACK, 
		align: C_ALIGN_CENTER
	}, function(){
		// オプション画面へ戻る
		clearWindow();
		optionInit();
	});
	divRoot.appendChild(btnBack);
}

/*-----------------------------------------------------------*/

/**
 * リザルト画面初期化
 */
function resultInit(){

	// レイヤー情報取得
	var layer0 = document.getElementById("layer0");
	var l0ctx = layer0.getContext("2d");
	var layer1 = document.getElementById("layer1");
	var l1ctx = layer1.getContext("2d");
	var layer2 = document.getElementById("layer2");
	var l2ctx = layer2.getContext("2d");
	var sWidth = layer0.width;
	var sHeight = layer0.height;
	var divRoot = document.getElementById("divRoot");

	// タイトル文字描画
	var lblTitle = getTitleDivLabel("lblTitle", 
	"<span style='color:#6666ff;font-size:40px;'>R</span>ESULT", 0, 15);
	divRoot.appendChild(lblTitle);

	// 戻るボタン描画
	var btnBack = createButton({
		id: "btnBack", 
		name: "Back", 
		x: 0, 
		y: sHeight-100, 
		width: sWidth/3, 
		height: C_BTN_HEIGHT, 
		fontsize: C_LBL_BTNSIZE,
		normalColor: C_CLR_DEFAULT, 
		hoverColor: C_CLR_BACK, 
		align: C_ALIGN_CENTER
	}, function(){
		// タイトル画面へ戻る
		clearWindow();
		titleInit();
	});
	divRoot.appendChild(btnBack);

	// Tweetボタン描画
	var btnTweet = createButton({
		id: "btnTweet", 
		name: "Tweet", 
		x: sWidth/3, 
		y: sHeight-100, 
		width: sWidth/3, 
		height: C_BTN_HEIGHT, 
		fontsize: C_LBL_BTNSIZE,
		normalColor: C_CLR_DEFAULT, 
		hoverColor: C_CLR_TWEET, 
		align: C_ALIGN_CENTER
	}, function(){
		// TODO:Tweet画面へ
	});
	divRoot.appendChild(btnTweet);
	
	// リトライボタン描画
	var btnRetry = createButton({
		id: "btnRetry", 
		name: "Retry", 
		x: sWidth/3 * 2, 
		y: sHeight-100, 
		width: sWidth/3, 
		height: C_BTN_HEIGHT, 
		fontsize: C_LBL_BTNSIZE,
		normalColor: C_CLR_DEFAULT, 
		hoverColor: C_CLR_RESET, 
		align: C_ALIGN_CENTER
	}, function(){
		// TODO:メイン画面への遷移
	});
	divRoot.appendChild(btnRetry);
}

/*-----------------------------------------------------------*/