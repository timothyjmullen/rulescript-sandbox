// TODO: Keep rules in local storage
  // http://www.w3schools.com/HTML/html5_webstorage.asp
// TODO: Make tabs functional
// TODO: Add JS Beautifier Function
// TODO: Add RuleScript Classes
// TODO: Make Data column functional

var config = ace.require("ace/config");
config.init();
var env = {};

/* PRINT TO CONSOLE
*********************************************************/
function conPrint(str) {
  if(str) {
    var out = document.createElement('div');
    out.setAttribute('id', 'output');
    out.innerHTML = str.replace(/([^:]*:)/ig, '<b>$1</b>');
    document.getElementById('print_console').appendChild(out);
  }
}

/* CLEAR CONSOLE
**********************************************************/
function clearConsole() {
  var myNode = document.getElementById("print_console");
  while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
  }
}

/* GET QUERY STRING
**********************************************************/
function getQueryString() {
  var assoc  = {};
  var decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ").replace(/\{\{LF\}\}/ig, "\u000A")); };
  var queryString = location.search.substring(1);
  var keyValues = queryString.split('&');

  for(var i in keyValues) {
    var key = keyValues[i].split('=');
    if (key.length > 1) {
      assoc[decode(key[0])] = decode(key[1]);
    }
  }
  return assoc;
}

/* BITLY API
*********************************************************/
function getBitly(url) {
  var xmlhttp,
      fullURL = 'https://api-ssl.bitly.com/v3/shorten?access_token=55d81251a8f3432a0e4ea43e3fd8a18ee9186d29&longUrl=' + url.replace(/%0A|%0D/ig, '{{LF}}') + '&format=txt';
  if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp=new XMLHttpRequest();
  }
  else { // code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange = function() {
    console.log(xmlhttp);
    if (xmlhttp.readyState==4 && xmlhttp.status==200) {
      document.getElementById("pop_in").value = xmlhttp.responseText;
    }
  }
  xmlhttp.open("GET",fullURL,true);
  xmlhttp.send();
}

/* BUILD QUERY STRING AND SHOW OUTPUT
**********************************************************/
function buildQueryString() {
  var code  = env.editor.getValue(),
      baseURL = 'https://connected.acxiom.com/sites/emarketingdelivery/cs/WebBased+Tools+and+Pages/RS+SB/rulescript-sandbox.html',
      inp = document.createElement('input'),
      pcon = document.getElementById('pop_content'),
      fullURL;

  inp.setAttribute('id', 'pop_in');
  inp.setAttribute('onClick', 'this.select()');
  fullURL = getBitly(encodeURIComponent(baseURL + '?code=' + code).replace(/%20/ig, '+'));
  //inp.value = fullURL;
  document.getElementById('pop_title').innerHTML = 'YOUR UNIQUE URL';
  pcon.innerHTML = 'Copy the following URL and share it with anybody who has access to this SharePoint Site. It will open your rule in its current state.<br />';
  pcon.appendChild(inp);
  document.getElementById('popup').style.display = 'block';
  document.getElementById('pop_in').select();
}

function closePop() {
  document.getElementById('popup').style.display = 'none';
}

/* RESIZABLE CONSOLE
**********************************************************/
var con = document.getElementById('console'),
    res = document.getElementById('con_header'),
    ed = document.getElementById('editor'),
    main = document.getElementById('main');
res.addEventListener('mousedown', initDrag, false);

var startX, startY, startWidth, startHeight;

function initDrag(e) {
resFlag = true;
 startX = e.pageX + con.offsetWidth;
 startY = e.pageY + con.offsetHeight;
 startWidth = parseInt(document.defaultView.getComputedStyle(res).width, 10);
 startHeight = parseInt(document.defaultView.getComputedStyle(res).height, 10);
 document.documentElement.addEventListener('mousemove', doDrag, false);
 document.documentElement.addEventListener('mouseup', stopDrag, false);
}

function doDrag(e) {
resFlag = true;
 //con.style.width = (startX - e.pageX) + 'px';
 if ((startY - e.pageY) > 20 && (startY - e.pageY) < (main.offsetHeight - 50)) {
   con.style.height = (startY - e.pageY) + 'px';
   ed.style.bottom = con.offsetHeight + 'px';
   env.editor.resize()
 } else if ((startY - e.pageY) > (main.offsetHeight - 50)) {
   con.style.height = (main.offsetHeight - 50) + 'px';
   ed.style.bottom = con.offsetHeight + 'px';
   env.editor.resize()
 } else {
   con.style.height = '20px';
   ed.style.bottom = con.offsetHeight + 'px';
   env.editor.resize()
 }
}

function stopDrag(e) {
  resFlag = false;
  document.documentElement.removeEventListener('mousemove', doDrag, false);
  document.documentElement.removeEventListener('mouseup', stopDrag, false);
}

/* jQuery stuff for menu - replace this with pure js later
**********************************************************/
$.noConflict();
jQuery(document).ready(function ($) {
    // Populate Menu
    /*$.ajax({
        url: "https://connected.acxiom.com/sites/emarketingdelivery/cs/WebBased%20Tools%20and%20Pages/ASCII%20Check/master_menu.txt",
        success: function (result) {
            $("#menubar").html(result);
        }
    });*/
    // Function for Menu Toggle Animation
    (function () {
        var toggles = document.querySelectorAll(".c-hamburger");
        for (var i = toggles.length - 1; i >= 0; i--) {
            var toggle = toggles[i];
            toggleHandler(toggle);
        };

        function toggleHandler(toggle) {
            toggle.addEventListener("click", function (e) {
                e.preventDefault();
                if (this.classList.contains("is-active") === true) {
                    this.classList.remove("is-active");
                    this.title = 'Menu';
                    $('#menubar').hide('slide', {
                        direction: 'right'
                    }, 250);
                } else {
                    this.classList.add("is-active");
                    this.title = 'Collapse';
                    $('#menubar').show('slide', {
                        direction: 'right'
                    }, 250);
                }
            });
        }
    })();
});

/* TABS
**********************************************************/
// Add new tab
function addTab() {
  console.log(EditSession.getDocument());
  editor.EditSession('test', 'JavaScript');
  console.log(EditSession.getDocument());
}

/* EXECUTE RULE
**********************************************************/
function exRule(editor) {
    try {
        var r = window.eval(env.editor.getCopyText() || env.editor.getValue());
    } catch(e) {
        r = e;
        conPrint(r + "");
    }
}

/* INIT ACE EDITOR SETTINGS
**********************************************************/
env.editor = ace.edit("editor");
env.editor.setTheme("ace/theme/chrome");
env.editor.getSession().setMode("ace/mode/javascript");
env.editor.getSession().setUseWrapMode(true);
env.editor.setShowPrintMargin(false);
env.editor.setFontSize(12);

// If there is a query string, then use it for the initial code value
var qs = getQueryString();
if (qs.code) {
  env.editor.setValue(qs.code);
}

/* KEY COMMANDS
**********************************************************/
env.editor.commands.addCommands([{
    name: "gotoline",
    bindKey: {win: "Ctrl-L", mac: "Command-L"},
    exec: function(editor, line) {
        if (typeof line == "object") {
            var arg = this.name + " " + env.editor.getCursorPosition().row;
            env.editor.cmdLine.setValue(arg, 1);
            env.editor.cmdLine.focus();
            return;
        }
        line = parseInt(line, 10);
        if (!isNaN(line))
            editor.gotoLine(line);
    },
    readOnly: true
}, {
    name: "focusCommandLine",
    bindKey: "shift-esc|ctrl-`",
    exec: function(editor, needle) { env.editor.cmdLine.focus(); },
    readOnly: true
}, {
    name: "nextFile",
    bindKey: "Ctrl-tab",
    exec: function(editor) { doclist.cycleOpen(editor, 1); },
    readOnly: true
}, {
    name: "previousFile",
    bindKey: "Ctrl-shift-tab",
    exec: function(editor) { doclist.cycleOpen(editor, -1); },
    readOnly: true
}, {
    name: "execute",
    bindKey: "Ctrl+Enter",
    exec: function(editor) {
        exRule(editor);
    },
    readOnly: true
}, {
    name: "showKeyboardShortcuts",
    bindKey: "Ctrl-Alt-h",
    exec: function(editor) {
        config.loadModule("ace/ext/keybinding_menu", function(module) {
            module.init(editor);
            env.editor.showKeyboardShortcuts();
        });
    }
}, {
    name: "increaseFontSize",
    bindKey: "Ctrl-=|Ctrl-+",
    exec: function(editor) {
        var size = parseInt(editor.getFontSize(), 10) || 12;
        env.editor.setFontSize(size + 1);
    }
}, {
    name: "decreaseFontSize",
    bindKey: "Ctrl+-|Ctrl-_",
    exec: function(editor) {
        var size = parseInt(editor.getFontSize(), 10) || 12;
        env.editor.setFontSize(Math.max(size - 1 || 1));
    }
}, {
    name: "resetFontSize",
    bindKey: "Ctrl+0|Ctrl-Numpad0",
    exec: function(editor) {
        env.editor.setFontSize(12);
    }
}]);

/* DEFINE BEAUTIFIER
**********************************************************/
// TODO: Add beutifier function


/*EVENT LISTENERS
**********************************************************/
document.getElementById("add_tab").addEventListener("click", addTab);
document.getElementById("con_reset").addEventListener("click", clearConsole);
document.getElementById("run").addEventListener("click", exRule);
document.getElementById("pop_close").addEventListener("click", closePop);
document.getElementById("link").addEventListener("click", buildQueryString);
