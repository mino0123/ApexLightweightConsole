var css = '' +
'    .apex-console {' +
'        position         : absolute;' +
'        top              : 30px;' +
'        left             : 200px;' +
'        z-index          : 2001;' +
'        background-color : white;' +
'    }' +
'    .apex-console-code {' +
'        height      : 300px;' +
'        width       : 800px;' +
'        display     : block;' +
'        resize      : both;' +
'        font-family : inconsolata;' +
'    }' +
'    .apex-console-bg {' +
'        position         : fixed;' +
'        top              : 0;' +
'        left             : 0;' +
'        opacity          : 0.5;' +
'        background-color : black;' +
'        height           : 100%;' +
'        width            : 100%;' +
'        z-index          : 2000;' +
'    }' +
'    .apex-console-execute {' +
'        margin-left      : 20px !important;' +
'    }' +
'    .apex-console-result {' +
'        width            : 100%;' +
'        padding-bottom   : 20px;' +
'    }' +
'    .apex-console-result table {' +
'        width            : 100%;' +
'        border-collapse  : collapse;' +
'    }' +
'    .apex-console-result th {' +
'        text-align    : center;' +
'        border-bottom : 1px solid #333;' +
'    }' +
'    .apex-console-result td {' +
'        border     : 1px dotted #CCC;' +
'    }' +
'    .apex-console-result-tabs {' +
'        display : inline-block;' +
'        background-color: white;' +
'        margin: 0;' +
'        padding: 0;' +
'    }' +
'    .apex-console-result-tabs li {' +
'        list-style-type : none;' +
'        float           : left;' +
'        margin          : 0.3em 0.1em;' +
'        border          : 1px gray solid;' +
'        padding         : 0px;' +
'        min-width       : 80px;' +
'    }' +
'    .apex-console-result-tabs li.selected {' +
'        background-color : #9999FF;' +
'    }' +
'    .apex-console-result-tabs li a {' +
'        text-decoration : none;' +
'        display         : block;' +
'        padding         : 0.5em;' +
'        cursor          : pointer;' +
'    }' +
'    .apex-console-result-tabs li a:hover {' +
'        background-color : #9999FF;' +
'        color            : #EFEFEF;' +
'    }' +
    '' +
'    .apex-console-buffers {' +
'        position         : absolute;' +
'        top              : 40px;' +
'        left             : 1000px;' +
'        z-index          : 2001;' +
'        display          : inline-block;' +
'        font-family      : inconsolata;' +
'        font-weight      : bold;' +
'    }' +
'    .apex-console-buffers li {' +
'        list-style-type  : none;' +
'        height           : 30px;' +
'        width            : 200px;' +
'        vertical-align   : middle;' +
'        border-radius    : 0 10px 10px 0;' +
'        background-color : #EEC;' +
'        box-shadow       : 2px 2px 3px #CCC;' +
'        clear            : both;' +
'    }' +
'    .apex-console-buffers li.selected {' +
'        box-shadow : none;' +
'        background-color : #FFD;' +
'    }' +
'    .apex-console-buffers li.selected a {' +
'        border-radius    : 0 10px 10px 0;' +
'    }' +
'    .apex-console-buffers li a {' +
'        text-decoration : none;' +
'        padding         : 0.5em;' +
'        cursor          : default;' +
'        margin          : auto;' +
'        display         : inline-block;' +
'    }' +
'    .apex-console-buffers input {' +
'        margin          : auto;' +
'        display         : inline-block;' +
'        width           : 100%;' +
'        height          : 100%;' +
'    }' +
'    .apex-console-buffers .remove {' +
'        float           : right;' +
'    }';
GM_addStyle(css);