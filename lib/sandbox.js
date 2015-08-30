// TODO: Keep rules in local storage
  // http://www.w3schools.com/HTML/html5_webstorage.asp
// TODO: Make rules shareable - bitly api?
  // http://dev.bitly.com/get_started.html

var env = {};

/* INIT ACE EDITOR SETTINGS
**********************************************************/
var editor = ace.edit("editor");
editor.setTheme("ace/theme/chrome");
editor.getSession().setMode("ace/mode/javascript");
editor.getSession().setUseWrapMode(true);
editor.setShowPrintMargin(false);
editor.setFontSize(13);

/* DRAGGABLE CONSOLE
**********************************************************
var resFlag = false;
var Draggable = function (id, initB, initR) {
  var el = document.getElementById(id),
      co = document.getElementById('console'),
      isDragReady = false,
      dragoffset = {
        x: 0,
        y: 0
      };

  this.init = function () {
    this.events();
  };

  // events for the element
  this.events = function () {
    var self = this;
    _on(el, 'mousedown', function (e) {
      if (!resFlag) {isDragReady = true;}
      // crossbrowser mouse pointer values
      e.pageX = e.pageX || e.clientX + (document.documentElement.scrollLeft ?
        document.documentElement.scrollLeft :
        document.body.scrollLeft);
      e.pageY = e.pageY || e.clientY + (document.documentElement.scrollTop ?
        document.documentElement.scrollTop :
        document.body.scrollTop);
      dragoffset.x = e.pageX - (co.offsetLeft + co.offsetWidth);
      dragoffset.y = e.pageY - (co.offsetTop + co.offsetHeight);
    });
    _on(document, 'mouseup', function () {
      isDragReady = false;
    });
    _on(document, 'mousemove', function (e) {
      if (isDragReady) {
        e.pageX = e.pageX || e.clientX + (document.documentElement.scrollLeft ?
          document.documentElement.scrollLeft :
          document.body.scrollLeft);
        e.pageY = e.pageY || e.clientY + (document.documentElement.scrollTop ?
          document.documentElement.scrollTop :
          document.body.scrollTop);
        document.getElementById('console').style.bottom = ((document.getElementById('main').offsetHeight + dragoffset.y) - e.pageY) + "px";
        document.getElementById('console').style.right = ((document.getElementById('main').offsetWidth + dragoffset.x) - e.pageX) + "px";
      }
    });
};
//cross browser event Helper function
var _on = function (el, event, fn) {
  document.attachEvent ? el.attachEvent('on' + event, fn) : el.addEventListener(event, fn, !0);
};
this.init();
}
new Draggable('con_header', '10px', '10px');
*/

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
   editor.resize()
 } else if ((startY - e.pageY) > (main.offsetHeight - 50)) {
   con.style.height = (main.offsetHeight - 50) + 'px';
   ed.style.bottom = con.offsetHeight + 'px';
   editor.resize()
 } else {
   con.style.height = '20px';
   ed.style.bottom = con.offsetHeight + 'px';
   editor.resize()
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

/* EDITOR BLOCK
**********************************************************/

editor.commands.addCommands([{
    name: "gotoline",
    bindKey: {win: "Ctrl-L", mac: "Command-L"},
    exec: function(editor, line) {
        if (typeof line == "object") {
            var arg = this.name + " " + editor.getCursorPosition().row;
            editor.cmdLine.setValue(arg, 1);
            editor.cmdLine.focus();
            return;
        }
        line = parseInt(line, 10);
        if (!isNaN(line))
            editor.gotoLine(line);
    },
    readOnly: true
}, {
    name: "snippet",
    bindKey: {win: "Alt-C", mac: "Command-Alt-C"},
    exec: function(editor, needle) {
        if (typeof needle == "object") {
            editor.cmdLine.setValue("snippet ", 1);
            editor.cmdLine.focus();
            return;
        }
        var s = snippetManager.getSnippetByName(needle, editor);
        if (s)
            snippetManager.insertSnippet(editor, s.content);
    },
    readOnly: true
}, {
    name: "focusCommandLine",
    bindKey: "shift-esc|ctrl-`",
    exec: function(editor, needle) { editor.cmdLine.focus(); },
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
    bindKey: "ctrl+enter",
    exec: function(editor) {
        try {
            var r = window.eval(editor.getCopyText() || editor.getValue());
        } catch(e) {
            r = e;
        }
        editor.cmdLine.setValue(r + "");
    },
    readOnly: true
}, {
    name: "showKeyboardShortcuts",
    bindKey: {win: "Ctrl-Alt-h", mac: "Command-Alt-h"},
    exec: function(editor) {
        config.loadModule("ace/ext/keybinding_menu", function(module) {
            module.init(editor);
            editor.showKeyboardShortcuts();
        });
    }
}, {
    name: "increaseFontSize",
    bindKey: "Ctrl-=|Ctrl-+",
    exec: function(editor) {
        var size = parseInt(editor.getFontSize(), 10) || 12;
        editor.setFontSize(size + 1);
    }
}, {
    name: "decreaseFontSize",
    bindKey: "Ctrl+-|Ctrl-_",
    exec: function(editor) {
        var size = parseInt(editor.getFontSize(), 10) || 12;
        editor.setFontSize(Math.max(size - 1 || 1));
    }
}, {
    name: "resetFontSize",
    bindKey: "Ctrl+0|Ctrl-Numpad0",
    exec: function(editor) {
        editor.setFontSize(12);
    }
}]);

/* CLEAR CONSOLE
**********************************************************/
function clearConsole() {
  var myNode = document.getElementById("print_console");
  while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
  }
}

/*EVENT LISTENERS
**********************************************************/
document.getElementById("add_tab").addEventListener("click", addTab);
document.getElementById("con_reset").addEventListener("click", clearConsole);
