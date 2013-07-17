// ==UserScript==
// @include        https://*salesforce.com/*
// @name           ApexLightweightConsole
// @noframes
// ==/UserScript==

function ApexConsole(){this.showed=this.initialized=!1;this.elements={};this.logView=null;this.viewElements=[];this.events=[]}ApexConsole.prototype.fire=function(a){this.events.forEach(function(b){(b=b[a])&&b()})};
ApexConsole.prototype.initialize=function(){var a=this.elements.content=document.createElement("div"),b=this.elements.code=document.createElement("textarea"),c=this.elements.bg=document.createElement("div"),d=this.elements.execute=document.createElement("button"),e=this.loading=new LoadingImage;this.fire("oninit");a.classList.add("apex-console");b.classList.add("apex-console-code");c.classList.add("apex-console-bg");d.classList.add("apex-console-execute");d.classList.add("btn");a.appendChild(b);a.appendChild(d);
e.insertAfter(d);var f=this;c.addEventListener("click",function(){f.hide()},!1);b.addEventListener("keydown",function(a){a.ctrlKey&&a.keyCode===a.DOM_VK_RETURN&&f.executeCode()},!1);d.textContent="execute  [Ctrl+Enter]";d.addEventListener("click",function(){try{f.executeCode()}catch(a){console.log(a)}});unsafeWindow.Ext||loadScript("/EXT/ext-3.0.0/ext-core.js");this.viewElements.push(a);this.viewElements.push(c);this.initialized=!0};ApexConsole.prototype.appendToBody=function(a){document.body.appendChild(a)};
ApexConsole.prototype.removeFromBody=function(a){a.parentNode&&document.body.removeChild(a)};ApexConsole.prototype.show=function(){this.initialized||this.initialize();this.viewElements.forEach(this.appendToBody);var a=this.elements.code;setTimeout(function(){a.select()},0);this.showed=!0};ApexConsole.prototype.setCode=function(a){var b=this.elements.code;b.value=a;b.style.height=Math.max(b.scrollHeight,300)+"px"};
ApexConsole.prototype.hide=function(){this.fire("onhide");this.viewElements.forEach(this.removeFromBody);this.showed=!1};ApexConsole.prototype.toggle=function(){this.showed?this.hide():this.show()};
ApexConsole.prototype.executeCode=function(){function a(a){f.getTrace(e,b)}function b(a){d.renderResult(a);d.loading.hide()}var c=this.elements.code.value;this.fire("onexe");var d=this,e,f=new ApexCSIAPI;f.executeAnonymous(c,function(b){b.success?(b=b.traces,e=b[b.length-1].id,f.open(e,a)):(alert(b.errorText),d.loading.hide())});this.loading.show()};ApexConsole.defaultTab=GM_getValue("selected-tab");
ApexConsole.prototype.renderResult=function(a){function b(a){for(var b=d.element.querySelectorAll("li a"),c=0,k=b.length;c<k;c++){var l=b[c];if(l.textContent===a)return l}}function c(a){var b=document.createEvent("MouseEvents");b.initEvent("click",!1,!0);a.dispatchEvent(b)}var d=this.logView;d?(d.logs=a,d.render()):(d=this.logView=new ApexLogView,d.logs=a,a=b(ApexConsole.defaultTab)||d.element.querySelector("li a"),c(a),this.elements.result=d.element,this.elements.content.appendChild(d.element))};function BufferList(a){(this.element=document.createElement("ul")).classList.add("apex-console-buffers");this.buffers={};this.console=a;this.load();this.render();this.selectedName=void 0;var b=this;a.events.push({oninit:function(){var a=b.buffers,d;for(d in a){b.select(a[d].name);break}},onexe:function(){b.save()}})}
BufferList.prototype.newBuffer=function(a){var b=this,c={};c.name=a.name;c.code=a.code;c.onrename=a.onrename;[function(a){c.name=a;c.onrename&&c.onrename();b.render()},function(){delete b.buffers[c.name];b.render()},function(a){c.element||(c.element=a.newListItem(c.name,b.createClickListener(c)));b.element.appendChild(c.element)}].forEach(function(a){c[a.name]=a});return c};
BufferList.prototype.load=function(){var a=GM_getValue("code"),b,c=this.buffers;try{b=JSON.parse(a)}catch(d){b={untitled:{name:"untitled",code:a||""}}}for(var e in b)a=b[e],c[a.name]=new Tab(this,a.name,a.code)};BufferList.prototype.save=function(){this.flushCode();GM_setValue("code",JSON.stringify(this.buffers))};
BufferList.prototype.render=function(){var a=this.buffers,b=this;this.element.innerHTML="";for(var c in a)a[c].render(this);a=this.newListItem(" + ",function(){var a=b.generateNewName();b.buffers[a]=new Tab(b,a,"");b.render()});this.element.appendChild(a);this.save()};BufferList.prototype.NEW_BUFFER_NAME="code";BufferList.prototype.generateNewName=function(){for(var a=this.buffers,b=0;this.NEW_BUFFER_NAME+ ++b in a;);return this.NEW_BUFFER_NAME+b};
BufferList.prototype.newListItem=function(a,b){var c=document.createElement("li"),d=document.createElement("a");d.textContent=a;d.href="javascript: void 0;";c.appendChild(d);c.addEventListener("click",b,!1);return c};BufferList.prototype.createClickListener=function(a){var b=this;return function(){b.select(a.name)}};BufferList.prototype.remove=function(a){delete this.buffers[a];this.render();if(!this.buffers[this.selectedName])for(var b in this.buffers){this.select(this.buffers[b].name);break}};
BufferList.prototype.add=function(a){this.buffers[a]={name:a,code:"",element:null};this.render()};BufferList.prototype.select=function(a){var b=this.buffers,c=this.console;this.save();this.selectedName=a;for(var d in b){var e=b[d];a===d?(c.setCode(e.code),e.element.classList.add("selected")):e.element.classList.remove("selected")}};BufferList.prototype.flushCode=function(){this.selectedName&&this.buffers[this.selectedName]&&(this.buffers[this.selectedName].code=this.console.elements.code.value)};
function Tab(a,b,c){this.list=a;this.name=b||c;this.code=c||""}Tab.prototype.editStart=function(){this.editing=!0;this.render()};Tab.prototype.editEnd=function(){var a=this.name;this.name=this.input.value;this.editing=!1;this.input=null;delete this.list.buffers[a];this.list.buffers[this.name]=this;this.list.save();this.render()};Tab.prototype.remove=function(){this.list.remove(this.name)};
Tab.prototype.render=function(){var a=this.element,b=this;a||(a=this.element=document.createElement("li"),a.addEventListener("click",function(){b.list.select(b.name)},!1),a.addEventListener("dblclick",function(){b.editStart()},!1));a.innerHTML="";if(this.editing){var c=this.input=document.createElement("input");c.type="text";c.value=this.name;c.addEventListener("blur",function(){b.editEnd()},!1);c.addEventListener("keypress",function(a){a.keyCode===KeyboardEvent.DOM_VK_RETURN&&b.editEnd()},!1);a.appendChild(c);
c.select()}else c=document.createElement("a"),c.textContent=this.name,c.href="javascript: void 0;",a.appendChild(c),c=document.createElement("a"),c.textContent="X",c.className="remove",c.href="javascript: void 0;",c.addEventListener("click",function(){b.remove()},!1),a.appendChild(c);a.parentNode||this.list.element.appendChild(a);return a};Tab.prototype.toJSON=function(){return{name:this.name,code:this.code}};function ApexCSIAPI(){this.url="/_ui/common/apex/debug/ApexCSIAPI"}ApexCSIAPI.createGeneralSuccessListener=function(a){return function(b){a(unsafeWindow.Util.evalAjaxServletOutput(b.responseText))}};ApexCSIAPI.generalFailureListener=function(){console.log(arguments)};ApexCSIAPI.prototype.config=function(a){unsafeWindow.Ext.Ajax.request({interval:2E4,url:this.url,params:{action:"CONFIG"},success:ApexCSIAPI.createGeneralSuccessListener(a),failure:ApexCSIAPI.generalFailureListener})};
ApexCSIAPI.prototype.poll=function(a){var b={action:"POLL",alreadyFetched:"",fewmetLocations:JSON.stringify([]),openClasses:"",traceLevels:JSON.stringify({APEX_CODE:"FINEST",VALIDATION:"INFO",WORKFLOW:"INFO",APEX_PROFILING:"INFO",DB:"INFO",CALLOUT:"INFO",VISUALFORCE:"INFO",SYSTEM:"DEBUG"}),workspace:JSON.stringify([])};unsafeWindow.Ext.Ajax.request({interval:2E4,url:this.url,params:b,success:ApexCSIAPI.createGeneralSuccessListener(a),failure:ApexCSIAPI.generalFailureListener})};
ApexCSIAPI.prototype.getAlreadyFetched=function(){return(this.traces||[]).map(function(a){return a.id})};
ApexCSIAPI.prototype.executeAnonymous=function(a,b){var c={action:"EXEC",alreadyFetched:this.getAlreadyFetched(),anonymousBody:a,startDate:Date.now(),fewmetLocations:JSON.stringify([]),openEditors:"",traceLevels:JSON.stringify({APEX_CODE:"FINEST",VALIDATION:"INFO",WORKFLOW:"INFO",APEX_PROFILING:"INFO",DB:"INFO",CALLOUT:"INFO",VISUALFORCE:"INFO",SYSTEM:"DEBUG"}),workspace:JSON.stringify([])};return unsafeWindow.Ext.Ajax.request({interval:2E4,url:this.url,params:c,success:ApexCSIAPI.createGeneralSuccessListener(b),
failure:ApexCSIAPI.generalFailureListener})};ApexCSIAPI.prototype.open=function(a,b){var c=[];c.push({id:a,name:(new Date).toISOString(),xtype:"logviewer"});c={action:"OPEN",entity:a,workspace:JSON.stringify(c)};unsafeWindow.Ext.Ajax.request({url:this.url,params:c,success:ApexCSIAPI.createGeneralSuccessListener(b),failure:ApexCSIAPI.generalFailureListener})};
ApexCSIAPI.prototype.getTrace=function(a,b){unsafeWindow.Ext.Ajax.request({timeout:6E4,url:"/servlet/debug/apex/ApexCSIJsonServlet",params:{extent:"steps",log:a},success:function(a){return function(b){a(JSON.parse(b.responseText))}}(b),failure:ApexCSIAPI.generalFailureListener})};var css="    .apex-console {        position         : absolute;        top              : 30px;        left             : 200px;        z-index          : 2001;        background-color : white;    }    .apex-console-code {        height      : 300px;        width       : 800px;        display     : block;        resize      : both;        font-family : inconsolata;    }    .apex-console-bg {        position         : fixed;        top              : 0;        left             : 0;        opacity          : 0.5;        background-color : black;        height           : 100%;        width            : 100%;        z-index          : 2000;    }    .apex-console-execute {        margin-left      : 20px !important;    }    .apex-console-result {        width            : 100%;        padding-bottom   : 20px;    }    .apex-console-result table {        width            : 100%;        border-collapse  : collapse;    }    .apex-console-result th {        text-align    : center;        border-bottom : 1px solid #333;    }    .apex-console-result td {        border     : 1px dotted #CCC;    }    .apex-console-result-tabs {        display : inline-block;        background-color: white;        margin: 0;        padding: 0;    }    .apex-console-result-tabs li {        list-style-type : none;        float           : left;        margin          : 0.3em 0.1em;        border          : 1px gray solid;        padding         : 0px;        min-width       : 80px;    }    .apex-console-result-tabs li.selected {        background-color : #9999FF;    }    .apex-console-result-tabs li a {        text-decoration : none;        display         : block;        padding         : 0.5em;        cursor          : pointer;    }    .apex-console-result-tabs li a:hover {        background-color : #9999FF;        color            : #EFEFEF;    }    .apex-console-buffers {        position         : absolute;        top              : 40px;        left             : 1000px;        z-index          : 2001;        display          : inline-block;        font-family      : inconsolata;        font-weight      : bold;    }    .apex-console-buffers li {        list-style-type  : none;        height           : 30px;        width            : 200px;        vertical-align   : middle;        border-radius    : 0 10px 10px 0;        background-color : #EEC;        box-shadow       : 2px 2px 3px #CCC;    }    .apex-console-buffers li.selected {        box-shadow : none;        background-color : #FFD;    }    .apex-console-buffers li.selected a {        border-radius    : 0 10px 10px 0;    }    .apex-console-buffers li a {        text-decoration : none;        padding         : 0.5em;        cursor          : default;        margin          : auto;        display         : inline-block;    }    .apex-console-buffers input {        margin          : auto;        display         : inline-block;        width           : 100%;        height          : 100%;    }    .apex-console-buffers .remove {        float           : right;    }";
GM_addStyle(css);function LoadingImage(){var a=this.element=document.createElement("img");a.src="/img/loading.gif";a.style.verticalAlign="middle";a.style.display="none"}LoadingImage.prototype.insertAfter=function(a){a.parentNode.insertBefore(this.element,a.nextSibiling)};LoadingImage.prototype.show=function(){this.element.style.display="inline"};LoadingImage.prototype.hide=function(){this.element.style.display="none"};function ApexLogView(){function a(a){a.classList.remove("selected")}function b(b,d){var f=document.createElement("li"),g=document.createElement("a");g.textContent=b;g.addEventListener("click",function(){GM_setValue("selected-tab",b);e.forEach(a);f.classList.add("selected");c.applyFilter(d)},!1);f.appendChild(g);e.push(f);return f}this.logs=null;this.element=document.createElement("div");this.element.classList.add("apex-console-result");var c=this,d=this.tabs=document.createElement("ul"),e=[];d.classList.add("apex-console-result-tabs");
for(var f in ApexLogView.filters)d.appendChild(b(f,ApexLogView.filters[f]));this.element.appendChild(d);this.table=document.createElement("table");this.element.appendChild(this.table)}function EventPair(a,b){this.start=a;this.end=b}new EventPair("EXECUTION_STARTED","EXECUTION_FINISHED");new EventPair("CODE_UNIT_STARTED","CODE_UNIT_FINISHED");new EventPair("SYSTEM_CONSTRUCTOR_ENTRY","SYSTEM_CONSTRUCTOR_EXIT");new EventPair("SYSTEM_METHOD_ENTRY","SYSTEM_METHOD_EXIT");var LogEvent={isEndEvent:function(a){}};
function LogThreeView(a){var b=0;for(a=a.length;b<a;b++);}LogThreeView.plusImage=function(){var a=document.createElement("img");a.src="/img/alohaSkin/setup/setup_plus_lev1.gif";return a};LogThreeView.minusImage=function(){var a=document.createElement("img");a.src="/img/alohaSkin/setup/setup_minus_lev1.gif";return a};
ApexLogView.prototype.render=function(){var a="category event file lineNumber iteration sequenceNumber frameSequenceNumber detail isExecutable method nanosSinceRequestStart".split(" "),a=["event","method","detail"],b=this.logs,c=this.table;c.innerHTML="";for(var d=c.insertRow(0),e=0,f=a.length;e<f;e++){var h=document.createElement("th");h.textContent=a[e];d.appendChild(h)}e=0;for(f=b.length;e<f;e++)if(d=b[e],this.filter(d))for(var k=c.insertRow(c.rows.length),l=k.cells,g=0,m=a.length;g<m;g++)h=k.insertCell(l.length),
h.innerHTML=d[a[g]]};ApexLogView.filters={EXECUTABLE:function(a){return a.isExecutable},USER_DEBUG:function(a){return"USER_DEBUG"===a.event},METHOD_ENTRY:function(a){return"SYSTEM_METHOD_ENTRY"===a.event||"SYSTEM_CONSTRUCTOR_ENTRY"===a.event||ApexLogView.filters.EXCEPTION(a)},EXCEPTION:function(a){return"EXCEPTION_THROWN"===a.event||"FATAL_ERROR"===a.event},LIMIT_USAGE_FOR_NS:function(a){return"LIMIT_USAGE_FOR_NS"===a.event},ALL:function(){return!0}};
ApexLogView.prototype.applyFilter=function(a){this.filter=a;this.render()};var window=window||unsafeWindow,apexConsole=new ApexConsole;unsafeWindow.apexConsole=apexConsole;unsafeWindow.ApexConsole=ApexConsole;var buffers=new BufferList(apexConsole);apexConsole.viewElements.push(buffers.element);apexConsole.buffers=buffers;window.addEventListener("keydown",function(a){try{a.ctrlKey&&(a.shiftKey&&a.keyCode===a.DOM_VK_X)&&apexConsole.toggle()}catch(b){console.log(b)}},!1);
function addNavLink(a,b){var c=document.querySelector(".linkElements");if(c){var d=document.createElement("a");d.textContent=a;d.href="javascript: void 0;";d.addEventListener("click",b,!1);c.insertBefore(d,c.firstChild)}}addNavLink("console",function(){try{apexConsole.show()}catch(a){console.log(a)}});
