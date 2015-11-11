// TODO: Keep rules in local storage
// http://www.w3schools.com/HTML/html5_webstorage.asp
// TODO: Add remaining RS classes to at least say that they are note supported at this time
// TODO: Clean up output formatting
// TODO: Make Data column functional

var config = ace.require("ace/config");
config.init();
var env = {};
var fileCache = {};
var tabUL = document.getElementById('tablist');
var EditSession = ace.require("ace/edit_session").EditSession;
var UndoManager = ace.require("ace/undomanager").UndoManager;

/* PRINT TO CONSOLE
 *********************************************************/
function conPrint(str, stack) {
    if (str) {
        var out = document.createElement('div'),
            st = (stack + "").replace(/.*?(\d{1,}:\d{1,})\) at eval.*/i, '$1'),
            con = document.getElementById("print_console");
        out.setAttribute('id', 'output');
        str = str.replace(/&/ig, '&amp;').replace(/\</ig, '&lt;').replace(/\>/ig, '&gt;');
        out.innerHTML = str.replace(/([^:]*:)/i, '<b style="text-transform:uppercase;">$1</b>').replace(/syntaxerror/i, 'SYNTAX ERROR').replace(/referenceerror/i, 'REFERENCE ERROR');
        con.appendChild(out);
        con.scrollTop = con.scrollHeight;
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
    var assoc = {};
    var decode = function (s) {
        return decodeURIComponent(s.replace(/\+/g, " ").replace(/\{N\}/ig, "\u000A").replace(/\{N\}/ig, "\u0009"));
    };
    var queryString = location.search.substring(1);
    var keyValues = queryString.split('&');

    for (var i in keyValues) {
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
    var xmlhttp = new XMLHttpRequest(),
        fullURL = 'https://api-ssl.bitly.com/v3/shorten?access_token=55d81251a8f3432a0e4ea43e3fd8a18ee9186d29&longUrl=' + url.replace(/%0A|%0D/ig, '{N}') + '&format=txt';
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            document.getElementById("pop_in").value = xmlhttp.responseText;
            document.getElementById('pop_in').select();
        }
    }
    xmlhttp.open("GET", fullURL, true);
    xmlhttp.send();
}

/* BUILD SHARE URL & SHOW/HIDE POPUP
 **********************************************************/
function buildQueryString() {
    var code = env.editor.getValue(),
        baseURL = 'https://connected.acxiom.com/sites/emarketingdelivery/cs/WebBased%20Tools%20and%20Pages/RS%20SB/rulescript-sandbox.html?code=',
        inp = document.createElement('input'),
        pcon = document.getElementById('pop_content'),
        fullURL;
    inp.setAttribute('id', 'pop_in');
    inp.setAttribute('onClick', 'this.select()');
    inp.value = 'Loading..'
    fullURL = getBitly(encodeURIComponent(baseURL + code).replace(/%20/ig, '+').replace(/%09/ig, '{T}'));
    //inp.value = baseURL + encodeURIComponent(code);
    document.getElementById('pop_title').innerHTML = 'Your Unique URL';
    pcon.innerHTML = 'Copy the following URL and share it with anybody who has access to this SharePoint Site. It will open your rule in its current state.<br />';
    pcon.appendChild(inp);
    document.getElementById('popup').style.display = 'block';
}

/* CLOSE POPUP
**********************************************************/
function closePop() {
    document.getElementById('popup').style.display = 'none';
    document.getElementById('pop_title').innerHTML = '';
    document.getElementById('pop_content').innerHTML = '';
}

/* FILE DROP
***********************************************************/
function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  var files = evt.dataTransfer.files; // FileList object.
  // files is a FileList of File objects. List some properties.
    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onloadend = (function(theFile) {
        if (theFile.target.readyState == FileReader.DONE) {
          env.editor.setValue(theFile.target.result);
        }
      });
      reader.readAsBinaryString(files[0]);
}

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
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

/* DOCUMENTS
 **********************************************************/
function createDocument(name, callback) {
  var session = new EditSession('');
  session.setUndoManager(new UndoManager());
  var doc = {'name': name, 'session':session }
  session.name = doc.name;
  session.setUseWrapMode(true);
  session.modeName = 'JavaScript';
  session.setMode('ace/mode/javascript');
  fileCache[name] = doc;
  return callback(name);
}
function removeDocument(name) {
  delete fileCache[name];
}
function swapDocument(name) {
  var session = fileCache[name].session;
  env.editor.setSession(session);
  env.editor.focus();
}

/* TABS
 **********************************************************/
// Ask for tab
function popupNT(warn) {
  var inp = document.createElement('input'),
        pcon = document.getElementById('pop_content');
  inp.setAttribute('id', 'pop_in_tab');
  inp.setAttribute('onClick', 'this.select()');
  inp.placeholder = 'Enter new tab name';
  document.getElementById('pop_title').innerHTML = 'New Tab Name';
  if (!warn) {
    pcon.appendChild(inp);
    pcon.innerHTML = pcon.innerHTML + '<div id="tsubmit">Submit</div>';
  }
  if (warn) {
    pcon.innerHTML = pcon.innerHTML + '<br style="clear:both;"" /><span class="warn">* Tab name already exists! *</span>';
  }
  popNTEvents();
  document.getElementById('popup').style.display = 'block';
  document.getElementById('pop_in_tab').focus();
 }
// Add new tab
function addTab(first, name) {
    if (first == true) {
      var tabs = tabUL;
      var nt = document.createElement('li');
      nt.innerHTML = '<span id="cons" title="New Rule">New Rule</span> <span class="close" title="Close Tab"><i class="fa fa-times"></i></span>';
      tabs.appendChild(nt);
      activeTab('n');
      tabEvents();
      createDocument('New Rule', function(name) {
        swapDocument(name);
      });
    } else {
      var nt = document.createElement('li');
      nt.innerHTML = '<span id="cons" title="' + name + '">' + name + '</span> <span class="close" title="Close Tab"><i class="fa fa-times"></i></span>';
      tabUL.appendChild(nt);
      createDocument(name, function(name) {
        swapDocument(name);
      });
      activeTab('n');
      tabEvents();
      env.editor.focus();
  }
}
// Close tab
function closeTab() {
  var li = this.parentNode;
  var ul = li.parentNode;
  var index = Array.prototype.indexOf.call(ul.children, li);
  if (/active/.test(li.getAttribute('class')) && ul.childNodes.length > 1) {
    if (ul.childNodes[index].nextSibling) {
      removeDocument(li.firstChild.innerHTML);
      ul.removeChild(ul.childNodes[index]);
      ul.childNodes[index].setAttribute('class', 'active');
      swapDocument(ul.childNodes[index].firstChild.innerText);
    } else {
      removeDocument(li.firstChild.innerHTML);
      ul.removeChild(ul.childNodes[index]);
      activeTab('c');
    }
  } else {
    removeDocument(li.firstChild.innerHTML);
    ul.removeChild(ul.childNodes[index]);
    activeTab('c');
  }
  tabEvents();
}
// Active tab
function activeTab(n) {
  var tabs = tabUL.querySelectorAll(".active");
  for (var k = 0; k < tabs.length; k++) {
    tabs[k].removeAttribute('class');
  }
  if (n == 'n') {
    tabUL.lastChild.setAttribute('class', 'active');
    env.editor.focus();
  } else if (n == 'c') {
    tabUL.lastChild.setAttribute('class', 'active');
    swapDocument(tabUL.lastChild.firstChild.innerText);
    env.editor.focus();
  } else {
    swapDocument(this.innerHTML);
    this.parentNode.setAttribute('class', 'active');
    env.editor.focus();
  }
}

/* EXECUTE RULE
 **********************************************************/
function exRule(editor) {
    try {
        var rule = env.editor.getValue();
        if (/document\.write/i.test(rule)) {
          conPrint('WARNING: document.write is not a valid RuleSript method. Use message.write instead.');
          rule = rule.replace(/document\.write/ig, "message.write");
        }
        var s = performance.now();
        var r = window.eval(rule);
        var e = performance.now();
        document.getElementById('exTime').innerHTML = '(' + (e - s).toFixed(4) + 'ms) <i class="fa fa-question-circle" id="time"><span class="tooltip" content="Over 1mm assemblies this could add approximately ' + hm(e-s) + ' to the launch time."></span></i>';
    } catch (e) {
        conPrint(e.toString(), e.stack + "");
    }
}
// Time Conversion
function hm(ms) {
    function pad(n) {
      if (n.toString().length < 2) {
        n = ("0" + n);
      } return n;
    }
    var seconds = Math.floor((ms / 1000) * 1000000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    if(hours) {
      minutes = minutes - (hours*60);
      seconds = seconds - (hours*60*60);
    }
    if(minutes) {seconds = seconds - (minutes*60)}

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}
/* RULESCRIPT CLASSES
 **********************************************************/
var message = {
    "links": [],
    "areas": [],
    "createTrackableLink": function (url, label, record, description, cat1, cat2) {
        if (this.links.indexOf(url) > -1) {
            // If it is already stored, don't store it again
            conPrint("REUSING EXISTING OFFER FOR URL " + url + ": \n  " + this.links.indexOf(url));
        } else {
            // new Offer
            conPrint("CREATING TRACKABLE LINK. URL: \n  " +
                url + "  Label: " +
                label + "  Description: " +
                description + "  Categories: " +
                cat1 + ", " + cat2 + ".");
            this.links.push(url);
        }
        return "<A HREF=\"redirectof:" + url + "\">" + label + "</A>";
    },
    "createTrackableArea": function (url, coords, shape, record, description) {
        if (this.areas.indexOf(url) > -1) {
            // Offer exists, re-use
            conPrint("REUSING EXITING OFFER FOR AREA: \n  " + coords);
        } else {
            conPrint("CREATING TRACKABLE AREA. URL: \n  " +
                url + "  Coordinates: " +
                coords + "  Shape: " +
                shape + "  Description: " +
                description + ".");
            this.links.push(coords);
        }
        return url;
    },
    "get": function (varName) {
        if (this[varName] !== undefined) {
            conPrint("RETRIEVING MESSAGE VARIABLE: \n  " + varName + " = " + JSON.stringify(this[varName]));
            return this[varName];
        } else {
            this.stopSending("Message Variable " + varName + " is not set.");
        }
    },
    "getCatalogID": function () {
        if (this.CatalogID) {
            return this.CatalogID;
        } else {
            // generate random 11 digit number
            var newVal = Math.floor(10000000000 + Math.random() * 1100000000);
            this.CatalogID = newVal;
            return newVal;
        }
    },
    "getPartFormat": function () {
        if (this.partFormat) {
            return this.partFormat;
        } else {
            // prompt for value and whether or not to keep it stored
            var newVal = prompt("Please enter a format. Possible values are: text, aol, clickable, html") || null;
            var regex = new RegExp(/^(text|aol|clickable|html)$/i);
            if (newVal === null || !regex.test(newVal)) {
                message.stopSending("Unable to retrieve valid format value!");
            } else {
                var save = confirm("Remember this value for the rest of the script?");
                if (save) {
                    this.partFormat = newVal.toLowerCase();
                }
                return newVal;
            }
        }
    },
    "getSendMode": function () {
        if (this.sendMode) {
            return this.sendMode;
        } else {
            // prompt for value and whether or not to keep it stored
            var newVal = prompt("Please enter a format. Possible values are: text, aol, clickable, html") || null;
            var regex = new RegExp(/^(normal|seedlist|test|preview)$/i);
            if (newVal === null || !regex.test(newVal)) {
                message.stopSending("Unable to retrieve valid send mode!");
            } else {
                var save = confirm("Remember this value for the rest of the script?");
                if (save) {
                    this.sendMode = newVal.toUpperCase();
                }
                return newVal;
            }
        }
    },
    "isSet": function (varName) {
        return this[varName] !== undefined;
    },
    "set": function (varName, newVal) {
        // if this[ varName ] DNE, it will be created and defined with the value newVal
        // if this[ varName ] exists, the value will be overwritten with newVal
        conPrint("SETTING MESSAGE VARIABLE: \n  " + varName + " = " + JSON.stringify(newVal));
        this[varName] = newVal;
    },
    "setHeaderFromRuleScript": function (header, value) {
        conPrint("SETTING HEADER <" + header + "> FROM RULESCRIPT. \n  VALUE: " + value);
    },
    "setMimeCharset": function (value) {
        conPrint("SETTING MIME CHARSET FROM RULESCRIPT. \n  VALUE: " + value);
        this.mimeCharset = value;
    },
    "getMimeCharset": function () {
        if (this.mimeCharset) {
            conPrint("GETTING MIME CHARSET FROM RULESCRIPT. \n  VALUE: " + this.mimeCharset);
            return this.mimeCharset;
        } else {
            // prompt for value and whether or not to keep it stored
            var newVal = prompt("Please enter a MIME Charset.") || null;
            this.mimeCharset = newVal;
            return newVal;
        }
    },
    "stopSending": function (error) {
        conPrint("ERROR - HALTING ASSEMBLY: \n  " + error);
    },
    "write": function (message) {
        conPrint("WRITE TO EMAIL: \n  " + message);
    }
};

var userdata = {
    "get": function (attrib) {
        if (this.data && this.data[attrib] !== undefined) {
            return this.data[attrib];
        } else {
            // prompt for value and whether or not to keep it stored
            var newVal = prompt("Value for userdata Attribute " + attrib + ":") || '';
            if (newVal === undefined) {
                //conPrint( "Value for attribute " + attrib + " is undefined.");
            } else {
                var save = confirm("Remember this value for the rest of the script?");
                if (save) {
                    if (this.data === undefined) {
                        this.data = {};
                    }
                    this.data[attrib] = newVal;
                }
                return newVal;
            }
        }
    },
    "set": function (newObj) {
        this.data = newObj;
    }
};

var util = {
    "capitalize": function (myString) {
        // capitalize each word
        if (myString) {
            return myString.toLowerCase().replace(/(^|\s|\t|\n|~|!|@|#|\$|%|\^|&|\*|\(|\)|_|-|\+|=|\||\\|\}|{|\[|:|;|"|'|<|,|>\.|\?|\/|])([a-z])/g, function (m, p1, p2) {
                return p1 + p2.toUpperCase();
            });
        } else {
            return myString;
        }
    },
    "FIRST": function () {
        return "FIRST";
    },
    "ALL": function () {
        return "ALL";
    },
    "search": function (haystack, needle, firstOrAll) {
        // check firstOrAll value and set global modifier
        if (!/ALL|FIRST/.test(firstOrAll)) {
            message.stopSending("Invalid util.search parameter. Use util.FIRST or util.ALL.");
        } else {
            firstOrAll = (/FIRST/.test(firstOrAll)) ? '' : 'g';
            // build regex string
            var re = new RegExp(needle, firstOrAll);
            // tell people that this method is really dumb
            conPrint("WARNING - util.search is not a well documented method. Try using string.match(regexp) instead.");
            // return array of matches
            return haystack.match(re);
        }
    },
    "replace": function (haystack, needle, thread, firstOrAll) {
        // replace a string or regex with another string
        return haystack.replace(needle, thread);
    },
    "parse": function (input) {
        // attempt to parse a DI tag -- Expand this as more parse uses are given
        var ret;
        conPrint("PARSING DI STRING: \n  " + input);
        if (input.search("DI_COMPONENT")) {
            var tmp = input.split(" ");
            var elm = tmp.filter(RegExp.prototype.test, /name/)[0];
            elm = elm.split('"');
            ret = "CODE FOR COMPONENT " + elm[1];
            var codeWrap = 'contentLibrary.show("' + elm[1] + '");';
            acxRunner(codeWrap, false);
        }
        conPrint("FINISHED PARSING DI STRING.");
        return ret;
    }
};

var cell = {
    "get": function (varName) {
        if (this[varName] !== undefined) {
            conPrint("RETRIEVING CELL VARIABLE: \n  " + varName + " = " + this[varName]);
            return this[varName];
        } else {
            message.stopSending("Cell Variable " + varName + " is not set.");
        }
    },
    "getTrackingCode": function () {
        if (this.trackingCode) {
            return this.trackingCode;
        } else {
            // prompt for value and whether or not to keep it stored
            var code = prompt("Value for cell's tracking code:") || null;
            if (code === null) {
                message.stopSending("Cell Tracking Code not set!");
            } else {
                var save = confirm("Remember this value for the rest of the script?");
                if (save) {
                    this.trackingCode = code;
                }
                return code;
            }
        }
    },
    "getCellName": function () {
        if (this.cellName) {
            return this.cellName;
        } else {
            // prompt for value and whether or not to keep it stored
            var code = prompt("Value for cell name:") || null;
            if (code === null) {
                message.stopSending("Cell name not set!");
            } else {
                var save = confirm("Remember this value for the rest of the script?");
                if (save) {
                    this.cellName = code;
                }
                return code;
            }
        }
    },
    "isFTAF": function () {
        if (this.FTAF) {
            return this.FTAF;
        } else {
            // prompt for value and whether or not to keep it stored
            var code = confirm("Execute code as an FTAF cell?\n\nOK: cell.isFTAF = true\nCancel: cell.isFTAF = false\n");
            var save = confirm("Remember this value for the rest of the script?");
            if (save) {
                this.FTAF = code;
            }
            return code;
        }
    },
    "isSet": function (varName) {
        return this[varName] !== undefined;
    },
    "set": function (varName, newVal) {
        // if this[ varName ] DNE, it will be created and defined with the value newVal
        // if this[ varName ] exists, the value will be overwritten with newVal
        conPrint("SETTING CELL VARIABLE: \n  " + varName + " = " + newVal);
        this[varName] = newVal;
    },
    "setTrackingCode": function (code) {
        conPrint("SETTING TRACKING CODE: \n  " + code);
        this.trackingCode = code;
    },
    "setCellName": function (code) {
        conPrint("SETTING CELL NAME: \n  " + code);
        this.cellName = code;
    }
};

var contentLibrary = {
    "show": function (component) {
        conPrint("DISPLAYING COMPONENT: \n  " + component);
    },
    "showRandom": function (contentNames) {
        var idx = Math.floor(Math.random() * (contentNames.length));
        conPrint("DISPLAYING RANDOM COMPONENT " + idx + ": \n  " + contentNames[idx]);
    }
};

var inputAttributes = {
    "get": function (ia) {
        if (this.attribs && this.attribs[ia] !== undefined) {
            return this.attribs[ia];
        } else {
            // prompt for value and whether or not to keep it stored
            var myValue = prompt("Value for inputAttribute " + ia + ":") || null;
            if (myValue === null) {
                var save = confirm("Remember this value for the rest of the script?");
                if (save) {
                    if (this.attribs === undefined) {
                        this.attribs = {};
                    }
                    this.attribs[ia] = myValue;
                }
            }
            return myValue;
        }
    },
    "set": function (newObj) {
        this.attribs = newObj;
    }
};

/* INIT ACE EDITOR SETTINGS
 **********************************************************/
env.editor = ace.edit("editor");
env.editor.setTheme("ace/theme/chrome");
env.editor.getSession().setMode("ace/mode/javascript");
env.editor.getSession().setUseWrapMode(true);
env.editor.setShowPrintMargin(false);
env.editor.setFontSize(12);
// Init first tab
addTab(true);

// If there is a query string, then use it for the initial code value
var qs = getQueryString();
if (qs.code) {
    env.editor.setValue(qs.code);
}

/* KEY COMMANDS
 **********************************************************/
env.editor.commands.addCommands([{
    name: "gotoline",
    bindKey: {
        win: "Ctrl-L",
        mac: "Command-L"
    },
    exec: function (editor, line) {
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
    exec: function (editor, needle) {
        env.editor.cmdLine.focus();
    },
    readOnly: true
}, {
    name: "nextFile",
    bindKey: "Ctrl-tab",
    exec: function (editor) {
        doclist.cycleOpen(editor, 1);
    },
    readOnly: true
}, {
    name: "previousFile",
    bindKey: "Ctrl-shift-tab",
    exec: function (editor) {
        doclist.cycleOpen(editor, -1);
    },
    readOnly: true
}, {
    name: "Execute",
    bindKey: "Ctrl+Enter",
    exec: function (editor) {
        exRule(editor);
    },
    readOnly: true
}, {
    name: "Share",
    bindKey: "Alt+S",
    exec: function (editor) {
        buildQueryString();
    },
    readOnly: true
}, {
    name: "New Tab",
    bindKey: "Alt+n",
    exec: function (editor) {
        popupNT(false);
    },
    readOnly: true
}, {
    name: "showKeyboardShortcuts",
    bindKey: "Ctrl-Alt-h",
    exec: function (editor) {
        config.loadModule("ace/ext/keybinding_menu", function (module) {
            module.init(editor);
            env.editor.showKeyboardShortcuts();
        });
    }
}, {
    name: "Beautify",
    bindKey: "Alt-B",
    exec: function (editor) {
        config.loadModule("ace/ext/beautify", function (module) {
            module.beautify(editor.session);
            //env.editor.beautify();
        });
    }
}, {
    name: "increaseFontSize",
    bindKey: "Ctrl-=|Ctrl-+",
    exec: function (editor) {
        var size = parseInt(editor.getFontSize(), 10) || 12;
        env.editor.setFontSize(size + 1);
    }
}, {
    name: "decreaseFontSize",
    bindKey: "Ctrl+-|Ctrl-_",
    exec: function (editor) {
        var size = parseInt(editor.getFontSize(), 10) || 12;
        env.editor.setFontSize(Math.max(size - 1 || 1));
    }
}, {
    name: "resetFontSize",
    bindKey: "Ctrl+0|Ctrl-Numpad0",
    exec: function (editor) {
        env.editor.setFontSize(12);
    }
}]);


/*EVENT LISTENERS
 **********************************************************/
 function tabEvents() {
   var tab_close = document.querySelectorAll(".close");
   var tabs = document.querySelectorAll("#cons");
       for (var i = 0; i < tab_close.length; i++) {
         tab_close[i].onclick = closeTab;
       }
       for (var j = 0; j < tabs.length; j++) {
         tabs[j].onclick = activeTab;
       }
 }
document.getElementById("add_tab").addEventListener("click", function() { popupNT(false)});
document.getElementById("con_reset").addEventListener("click", clearConsole);
document.getElementById("run").addEventListener("click", exRule);
document.getElementById("pop_close").addEventListener("click", closePop);
document.getElementById("link").addEventListener("click", buildQueryString);
document.getElementById("keys").addEventListener("click", function () {
    config.loadModule("ace/ext/keybinding_menu", function (module) {
        module.init(env.editor);
        env.editor.showKeyboardShortcuts();
    });
});
document.getElementById("format").addEventListener("click", function () {
    config.loadModule("ace/ext/beautify", function (module) {
        module.beautify(env.editor.session);
        //env.editor.session.beautify();
    });
});
function popNTEvents () {
document.getElementById("tsubmit").addEventListener("click", function(){
  if (!fileCache[document.getElementById('pop_in_tab').value]){
    addTab(false, document.getElementById('pop_in_tab').value);
    closePop();
  } else {
    popupNT(true);
  }
});
document.getElementById("pop_in_tab").addEventListener("keydown", function(e){
   if (e.which == 13 || e.keyCode == 13) {
     if (!fileCache[document.getElementById('pop_in_tab').value]){
      addTab(false, document.getElementById('pop_in_tab').value);
      closePop();
    } else {
      popupNT(true);
    }
  }
});
}
var ed = document.getElementById("editor");
ed.addEventListener('dragover', handleDragOver, false);
ed.addEventListener('drop', handleFileSelect, false);
tabEvents();
