// ==UserScript==
// @include        https://*salesforce.com/*
// @name           ApexLightweightConsole
// @noframes       
// ==/UserScript==

function ApexConsole() {
	this.initialized    = false; // boolean
	this.showed         = false; // boolean
	this.elements       = {};    // Hash of Element {content,code,bg,execute,result}
	this.logView        = null;  // ApexLogView
}
ApexConsole.prototype.initialize = function apex_console_initialize() {
	var content = this.elements.content = document.createElement('div'),
	    code    = this.elements.code    = document.createElement('textarea'),
	    bg      = this.elements.bg      = document.createElement('div'),
	    execute = this.elements.execute = document.createElement('button'),
	    loading = this.loading          = new LoadingImage();
	
	code.value = GM_getValue('code') || '';
	
	content.classList.add('apex-console');
	code.classList.add('apex-console-code');
	bg.classList.add('apex-console-bg');
	execute.classList.add('apex-console-execute');
	execute.classList.add('btn');
	
	content.appendChild(code);
	content.appendChild(execute);
	loading.insertAfter(execute);
	
	var that = this;
	
	bg.addEventListener('click', function apex_console_bgclick() {
		that.hide();
	}, false);
	code.addEventListener('keydown', function (event) {
		if (event.ctrlKey && event.keyCode === event.DOM_VK_RETURN) {
			that.executeCode();
		}
	}, false);
	
	execute.textContent = 'execute  [Ctrl+Enter]';
	execute.addEventListener('click', function apex_console_executeclick() {
		that.executeCode();
	});
	
	unsafeWindow.XBrowser.createDynamicScript('/soap/ajax/23.0/connection.js');
	unsafeWindow.XBrowser.createDynamicScript('/soap/ajax/23.0/apex.js');
	
	GM_addStyle(css);
	
	this.initialized = true;
};
ApexConsole.prototype.show = function apex_console_show() {
	if (! this.initialized) {
		this.initialize();
	}
	
	var elements = this.elements;
	document.body.appendChild(elements.content);
	document.body.appendChild(elements.bg);
	
	var code = elements.code;
	setTimeout(function () { // すぐにselectすると
		code.select();       // テキストエリアの表示がおかしくなる
	}, 0);                   // 
	
	this.showed = true;
};
ApexConsole.prototype.hide = function apex_console_hide() {
	var elements = this.elements;
	document.body.removeChild(elements.content);
	document.body.removeChild(elements.bg);
	this.showed = false;
};
ApexConsole.prototype.toggle = function apex_console_toggle() {
	if (this.showed) {
		this.hide();
	} else {
		this.show();
	}
};
ApexConsole.prototype.executeCode = function apex_console_executecode() {
	var code = this.elements.code.value;
	
	GM_setValue('code', code);
	
	var that = this;
	var executeId;
	var csi = new ApexCSIAPI();
	csi.executeAnonymous(code, onExecuteAnonymousEnd);
	
	this.loading.show();
	
	function onExecuteAnonymousEnd(result) {
		if (result.success) {
			var traces = result.traces;
			executeId = traces[traces.length - 1].id;
			csi.open(executeId, onOpenEnd);
		} else {
			alert(result.errorText);
			that.loading.hide();
		}
	}
	function onOpenEnd(result) {
		csi.getTrace(executeId, onGetTraceEnd);
	}
	function onGetTraceEnd(result) {
		that.renderResult(result);
		that.loading.hide();
	}
};
ApexConsole.defaultTab = GM_getValue('selected-tab');// unsafeWindowからはGM_getValueを使用できないためここで読み込んでおく
ApexConsole.prototype.renderResult = function (logs) {
	var logView = this.logView;
	if (! logView) {
		logView = this.logView = new ApexLogView();
		logView.logs = logs;
		
		var selectedTab = ApexConsole.defaultTab
		var defaultSelectedTab = getTabByText(selectedTab) || getFirstTab();
		dispatchClick(defaultSelectedTab);
		
		this.elements['result'] = logView.element;
		this.elements.content.appendChild(logView.element);
	} else {
		logView.logs = logs;
		logView.render();
	}
	
	function getTabByText(text) {
		var tabs = logView.element.querySelectorAll('li a');
		for (var i = 0, len = tabs.length; i < len; i++) {
			var t = tabs[i];
			if (t.textContent === text) {
				return t;
			}
		}
	}
	function getFirstTab() {
		return logView.element.querySelector('li a');
	}
	function dispatchClick(element) {
		var event = document.createEvent('MouseEvents');
		event.initEvent("click", false, true);
		element.dispatchEvent(event);
	}
};

function LoadingImage() {
	var element = this.element  = document.createElement('img');
	element.src                 = '/img/loading.gif';
	element.style.verticalAlign = 'middle';
	element.style.display       = 'none';
}
LoadingImage.prototype.insertAfter = function (target) {
	var parent = target.parentNode;
	parent.insertBefore(this.element, target.nextSibiling);
};
LoadingImage.prototype.show = function () {
	this.element.style.display = 'inline';
};
LoadingImage.prototype.hide = function () {
	this.element.style.display = 'none';
};

function ApexLogView() {
	this.logs = null;
	
	this.element = document.createElement('div');
	this.element.classList.add('apex-console-result');
	
	var that = this;
	var tabs = this.tabs = document.createElement('ul');
	var tabElements = [];
	tabs.classList.add('apex-console-result-tabs');
	for (var i in ApexLogView.filters) {
		tabs.appendChild(createFilterTab(i, ApexLogView.filters[i]));
	}
	this.element.appendChild(tabs);
	
	this.table = document.createElement('table');
	this.element.appendChild(this.table);
	
	function removeSelected(e) {
		e.classList.remove('selected');
	}
	function createFilterTab(label, filter) {
		var li = document.createElement('li');
		var a = document.createElement('a');
		a.textContent = label;
		a.addEventListener('click', function () {
			GM_setValue('selected-tab', label);
			tabElements.forEach(removeSelected);
			li.classList.add('selected');
			that.applyFilter(filter);
		}, false);
		li.appendChild(a);
		tabElements.push(li);
		return li;
	}
}
ApexLogView.prototype.render = function() {
	var params = 'category|event|file|lineNumber|iteration|sequenceNumber|frameSequenceNumber|detail|isExecutable|method|nanosSinceRequestStart'.split('|');
	params = 'event|method|detail'.split('|');
	var logs = this.logs,
	    table = this.table;
	table.innerHTML = '';
	
	var headerRow = table.insertRow(0);
	for (var i = 0, len = params.length; i < len; i++) {
		var cell = document.createElement('th');
		cell.textContent = params[i];
		headerRow.appendChild(cell);
	}
	for (var i = 0, len = logs.length; i < len; i++) {
		var log = logs[i];
		if (! this.filter(log)) {
			continue;
		}
		var row = table.insertRow(table.rows.length);
		var cells = row.cells;
		for (var j = 0, paramLen = params.length; j < paramLen; j++) {
			var cell = row.insertCell(cells.length);
			cell.textContent = log[params[j]];
		}
	}
};
ApexLogView.filters = {
	EXECUTABLE : function (log) {
		return log.isExecutable;
	},
	USER_DEBUG : function (log) {
		return log.event === 'USER_DEBUG';
	},
	EXCEPTION : function (log) {
		return log.event === 'EXCEPTION_THROWN' || log.event === 'FATAL_ERROR';
	},
	LIMIT_USAGE_FOR_NS : function (log) {
		return log.event === 'LIMIT_USAGE_FOR_NS';
	},
	ALL : function () {return true;}
};
ApexLogView.prototype.applyFilter = function(filter) {
	this.filter = filter;
	this.render();
};

function ApexCSIAPI() {
	this.url = '/_ui/common/apex/debug/ApexCSIAPI';
}
ApexCSIAPI.createGeneralSuccessListener = function (callback) {
	return function (result) {
		callback(unsafeWindow.Util.evalAjaxServletOutput(result.responseText));
	}
};
ApexCSIAPI.generalFailureListener = function () {
	console.log(arguments);
};
ApexCSIAPI.prototype.config = function (callback) {
	unsafeWindow.Ext.Ajax.request({
		interval : 2E4,
		url      : this.url,
		params   : {action : 'CONFIG'},
		success  : ApexCSIAPI.createGeneralSuccessListener(callback),
		failure : ApexCSIAPI.generalFailureListener
	});
};
ApexCSIAPI.prototype.poll = function (callback) {
	var params = {
		action          : 'POLL',
		alreadyFetched  : '',
		fewmetLocations : JSON.stringify([]),
		openClasses     : '',
		traceLevels     : JSON.stringify({"APEX_CODE":"FINEST","VALIDATION":"INFO","WORKFLOW":"INFO","APEX_PROFILING":"INFO","DB":"INFO","CALLOUT":"INFO","VISUALFORCE":"INFO","SYSTEM":"DEBUG"}),
		workspace       : JSON.stringify([])
	};
	unsafeWindow.Ext.Ajax.request({
		interval : 2E4,
		url      : this.url,
		params   : params,
		success  : ApexCSIAPI.createGeneralSuccessListener(callback),
		failure : ApexCSIAPI.generalFailureListener
	});
};
ApexCSIAPI.prototype.getAlreadyFetched = function () {
	return (this.traces || []).map(function (trace) {
		return trace.id;
	});
};
ApexCSIAPI.prototype.executeAnonymous = function (anonymousBody, callback) {
	var params = {
		action          : 'EXEC',
		alreadyFetched  : this.getAlreadyFetched(),
		anonymousBody   : anonymousBody,
		startDate       : Date.now(),
		fewmetLocations : JSON.stringify([]),
		openEditors     : '',
		traceLevels     : JSON.stringify({"APEX_CODE":"FINEST","VALIDATION":"INFO","WORKFLOW":"INFO","APEX_PROFILING":"INFO","DB":"INFO","CALLOUT":"INFO","VISUALFORCE":"INFO","SYSTEM":"DEBUG"}),
		workspace       : JSON.stringify([])
	};
	return unsafeWindow.Ext.Ajax.request({
		interval : 2E4,
		url      : this.url,
		params   : params,
		success  : ApexCSIAPI.createGeneralSuccessListener(callback),
		failure  : ApexCSIAPI.generalFailureListener
	});
};
ApexCSIAPI.prototype.open = function (entity, callback) {
	var workspace = [];
	workspace.push({
		id    : entity,
		name  : (new Date()).toISOString(),
		xtype : "logviewer"
	});
	var params = {
		action    : 'OPEN',
		entity    : entity,
		workspace : JSON.stringify(workspace)
	};
	unsafeWindow.Ext.Ajax.request({
		url     : this.url,
		params  : params,
		success : ApexCSIAPI.createGeneralSuccessListener(callback),
		failure : ApexCSIAPI.generalFailureListener
	});
};
ApexCSIAPI.prototype.getTrace = function (traceId, callback) {
	var params = {
		extent : 'steps',
		log    : traceId
	};
	unsafeWindow.Ext.Ajax.request({
		url     : '/servlet/debug/apex/ApexCSIJsonServlet',
		params  : params,
		success : createJsonSuccessListener(callback),
		failure : ApexCSIAPI.generalFailureListener
	});
	function createJsonSuccessListener(callback) {
		return function (result) {
			callback(JSON.parse(result.responseText));
		}
	}
};


var css = <><![CDATA[
	.apex-console {
		position         : absolute;
		top              : 30px;
		left             : 200px;
		z-index          : 2001;
		background-color : white;
	}
	.apex-console-code {
		height    : 300px;
		width     : 800px;
		display   : block;
	}
	.apex-console-bg {
		position         : fixed;
		top              : 0;
		left             : 0;
		opacity          : 0.5;
		background-color : black;
		height           : 100%;
		width            : 100%;
		z-index          : 2000;
	}
	.apex-console-execute {
		margin-left      : 20px !important;
	}
	.apex-console-result {
		width            : 100%;
		padding-bottom   : 20px;
	}
	.apex-console-result table {
		width            : 100%;
		border-collapse  : collapse;
	}
	.apex-console-result th {
		text-align    : center;
		border-bottom : 1px solid #333;
	}
	.apex-console-result td {
		border     : 1px dotted #CCC;
	}
	.apex-console-result-tabs {
		display : inline-block;
		background-color: white;
		margin: 0;
		padding: 0;
	}
	.apex-console-result-tabs li {
		list-style-type : none;
		float           : left;
		margin          : 0.3em 0.1em;
		border          : 1px gray solid;
		padding         : 0px;
		min-width       : 80px;
	}
	.apex-console-result-tabs li.selected {
		background-color : #9999FF;
	}
	.apex-console-result-tabs li a {
		text-decoration : none;
		display         : block;
		padding         : 0.5em;
		cursor          : pointer;
	}
	.apex-console-result-tabs li a:hover {
		background-color : #9999FF;
		color            : #EFEFEF;
	}
	
]]></>.toString();



var apexConsole = new ApexConsole();
unsafeWindow.apexConsole = apexConsole;
unsafeWindow.ApexConsole = ApexConsole;
window.addEventListener('keydown', function windowKeyDownListener(event) {
	if (event.ctrlKey && event.shiftKey && event.keyCode === event.DOM_VK_X) {
		apexConsole.toggle();
	}
}, false);
(function () {
	var linkElementsWrapper = document.querySelector('.linkElements');
	if (linkElementsWrapper) {
		var showConsole = function () {apexConsole.show();};
		var apexConsoleElement = document.createElement('a');
		apexConsoleElement.textContent = 'console';
		apexConsoleElement.href = 'javascript: void 0;';
		apexConsoleElement.addEventListener('click', showConsole, false);
		linkElementsWrapper.insertBefore(apexConsoleElement, linkElementsWrapper.firstChild);
	}
})();