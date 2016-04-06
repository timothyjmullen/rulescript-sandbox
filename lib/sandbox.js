// TODO: Rules in local storage
// TODO: Add remaining RS classes to at least say that they are not supported at this time

var config = ace.require("ace/config");
config.init();
var env = {};
var fileCache = {};
var tabUL = document.getElementById('tablist');
var EditSession = ace.require("ace/edit_session").EditSession;
var UndoManager = ace.require("ace/undomanager").UndoManager;
var firepad, firepadRef;

/* PRINT TO CONSOLE
 *********************************************************/
function conPrint(str, stack) {
    if (str) {
        var out = document.createElement('div'),
            st = (stack + "").replace(/.*?(\d{1,}:\d{1,})\) at eval.*/i, '$1'),
            con = document.getElementById("print_console");
        out.setAttribute('id', 'output');
        str = str.replace(/&/ig, '&amp;').replace(/\</ig, '&lt;').replace(/\>/ig, '&gt;');
        out.innerHTML = str.replace(/([^:]*:)/i, '<b style="text-transform:uppercase;">$1</b>')
                            .replace(/syntaxerror/i, 'SYNTAX ERROR')
                            .replace(/referenceerror/i, 'REFERENCE ERROR');
        con.appendChild(out);
        con.scrollTop = con.scrollHeight;
    }
}

/* CLEAR CONSOLE
 **********************************************************/
function clearConsole() {
    var con = document.getElementById("print_console");
    while (con.firstChild) {
        con.removeChild(con.firstChild);
    }
}
/* CLEAR DATA
 **********************************************************/
 function clearData(del) {
    var dcol = document.getElementById("data_input");
    if (del) {
      for (x in env.dat) { delete env.dat[x]; }
    };
    while (dcol.firstChild) {
        dcol.removeChild(dcol.firstChild);
    }
    env.dat.msgvar = {};
}
/* FIND ATTRIBUTES
 **********************************************************/
 function findAttr() {
   var rule = env.editor.getValue(), attr;
     attr = rule.replace(/userdata\.get\((?:'|")?([^'")]*)/ig, function(one, two) {
       if (typeof env.dat[two] === "undefined") {addData(two);}
     });
     attr = rule.replace(/inputAttributes\.get\((?:'|")?([^'")]*)/ig, function(one, two) {
       if (typeof env.dat[two] === "undefined") {addData(two);}
     });
     attr = rule.replace(/cell\.getTrackingCode\((?:'|")?([^'")]*)/ig, function(one) {
       if (typeof env.dat['Tracking Code'] === "undefined") {addData('Tracking Code');}
     });
     attr = rule.replace(/cell\.getCellName\((?:'|")?([^'")]*)/ig, function(one) {
       if (typeof env.dat['Cell Name'] === "undefined") {addData('Cell Name');}
     });
     attr = rule.replace(/message\.getPartFormat\((?:'|")?([^'")]*)/ig, function(one) {
       if (typeof env.dat['Part Format'] === "undefined") {addData('Part Format', ['html', 'text', 'aol', 'clickable']);}
     });
     attr = rule.replace(/cell\.isFTAF\((?:'|")?([^'")]*)/ig, function(one) {
       if (typeof env.dat.FTAF === "undefined") {addData('FTAF', [true, false]);}
     });
     attr = rule.replace(/message\.getSendMode\((?:'|")?([^'")]*)/ig, function(one) {
       if (typeof env.dat['Send Mode'] === "undefined") {addData('Send Mode', ['NORMAL', 'SEEDLIST', 'TEST', 'WEBVIEW', 'WEBVIEW_TEST', 'WEBVIEW_SEEDLIST', 'SHARED', 'SHARED_TEST', 'SHARED_SEEDLIST', 'PREVIEW']);}
     });
 }
 /* FIND ATTRIBUTES
  **********************************************************/
function dataOut() {
  for (var e in env.dat) {
    var dcol = document.getElementById("data_input"), out, int, inb;
    out = document.createElement('div');
    int = document.createElement('input');
    int.setAttribute('class', 'top');
    int.value = e;
    int.setAttribute('disabled', 'disabled');
    out.appendChild(int);
    inb = document.createElement('input');
    inb.setAttribute('class', 'bottom');
    inb.setAttribute('placeholder', "Value");
    inb.setAttribute('name', e);
    inb.value = env.dat[e] || '';
    out.appendChild(inb);
    out.setAttribute('class', 'input_block');
    dcol.appendChild(out);
    env.editor.focus();
  }
}
 /* GET ATTRIBUTES VALUES
  **********************************************************/
function getAttrVals() {
  var val;
  for (x in env.dat) {
    val = document.getElementsByName(x)[0];
    if (typeof val != "undefined") {
      env.dat[x] = val.value;
    }
  }
}
/* ADD DATA
 **********************************************************/
 function dataPop(warn) {
    var inp = document.createElement('input'),
        pcon = document.getElementById('pop_content');
    inp.setAttribute('id', 'pop_in_tab');
    inp.setAttribute('onClick', 'this.select()');
    inp.placeholder = 'Enter new attribute name';
    document.getElementById('pop_title').innerHTML = 'New Attribute Name';
    if (!warn) {
      document.getElementById('pop_content').innerHTML = '';
      pcon.appendChild(inp);
      pcon.innerHTML = pcon.innerHTML + '<div id="tsubmit">Submit</div>';
    }
    if (warn) {
      pcon.innerHTML = (warn == "empty") ? pcon.innerHTML + '<br style="clear:both;"" /><span class="warn">* Attribute name cannot be empty! *</span>' : pcon.innerHTML + '<br style="clear:both;"" /><span class="warn">* Attribute name already exists! *</span>';
    }
    popDataEvents();
    document.getElementById('popup').style.display = 'block';
    document.getElementById('pop_in_tab').focus();
}
function addData (name, list) {
  var dcol = document.getElementById("data_input"),
      out, int, inb;
  //getAttrVals();
  clearData();
  if (name) {env.dat[name] = (list) ? list : '';}
  for (var v in env.dat) {
    if (v != 'msgvar') {
		out = document.createElement('div');
		int = document.createElement('input');
		int.setAttribute('class', 'top');
		int.value = v;
		int.setAttribute('disabled', 'disabled');
		out.appendChild(int);
		if (/(part format)|(FTAF)|(send mode)/i.test(v) && typeof env.dat[v] === 'object') {
		  sel = document.createElement('select');
		  sel.setAttribute('name', v);
		  sel.setAttribute('class', 'bottom');
		  for (var s = 0;s < env.dat[v].length; s++) {
			inb = document.createElement('option');
			inb.setAttribute('value', env.dat[v][s]);
			inb.innerHTML = env.dat[v][s];
			sel.appendChild(inb);
		  }
		  out.appendChild(sel);
		} else {
		  inb = document.createElement('input');
		  inb.setAttribute('class', 'bottom');
		  inb.setAttribute('placeholder', "Value");
		  inb.setAttribute('name', v);
		  inb.value = env.dat[v] || '';
		  out.appendChild(inb);
		}
		out.setAttribute('class', 'input_block');
		dcol.appendChild(out);
	}
  }
  env.editor.focus();
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
function buildQueryString(id, hash) {
  var inp = document.createElement('input'),
  pcon = document.getElementById('pop_content'), baseURL;
  if (window.location.href.indexOf('?') > -1) {
    baseURL = window.location.href.replace(location.search, '');
  } else if (window.location.hash) {
    baseURL = window.location.href.replace(location.hash, '');
  } else {
    baseURL = window.location.href;
  }

  inp.setAttribute('id', 'pop_in');
  inp.setAttribute('onClick', 'this.select()');
  inp.value = 'Loading..'

  if (hash) {
    baseURL += '#' + hash;
  	document.getElementById('pop_title').innerHTML = 'Your Unique URL';
  	pcon.innerHTML = 'Copy the following URL and share it with anybody who has access to this SharePoint Site. It will open your collaboration session.<br />';
  } else {
    baseURL += '?id=' + id;
  	document.getElementById('pop_title').innerHTML = 'Your Unique URL';
  	pcon.innerHTML = 'Copy the following URL and share it with anybody who has access to this SharePoint Site. It will open your rule in its current state.<br />';
  }

	pcon.appendChild(inp);
	document.getElementById("pop_in").value = baseURL;
	document.getElementById('pop_in').select();
	document.getElementById('popup').style.display = 'block';
}

/* Firebase Integration
 ***********************************************************/
var ref = new Firebase("https://dazzling-fire-3931.firebaseio.com/");
var ruleRef = ref.child("rules");
var version = 0;

function guidGenerator() {
  var S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
};

function saveToFirebase(uuid) {
  getAttrVals();
	var code = btoa(env.editor.getValue()),
      data = btoa(JSON.stringify(env.dat));
	if (!uuid) {
		var rule = {};

		env.uuidx = guidGenerator();
		var idRef = ruleRef.child(env.uuidx);
		var versionRef = idRef.child("version");
		//rule.version = {
		//	[version]: code
		//};
		rule.date = Date();
		idRef.set(rule);
		versionRef.push({
			"name": env.name,
			"code": code,
			"data": data,
			"date": Date()
		})
		buildQueryString(env.uuidx);
	} else {
		var idRef = ruleRef.child(env.uuidx);
		var versionRef = idRef.child("version");
		versionRef.push({
			"name": env.name,
			"code": code,
			"data": data,
			"date": Date()
		})
		buildQueryString(env.uuidx)
	}
	version++
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

/* jQuery stuff for menu - replace this with pure js and CSS later
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
function createDocument(name, data, callback, collab) {
  var session = new EditSession('');
  session.setUndoManager(new UndoManager());
  var doc = {'name': name, 'session': session, 'dat': data || {'msgvar':{}}, 'uuidx': '', collab: collab || '' };
  doc.dat.msgvar = {};
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
  if (firepad) {firepad.dispose();firepad=undefined;}
  getAttrVals();
  env.dat = fileCache[name].dat;
  // Clear message level cache on doc swap
  env.dat.msgvar = {};
  env.name = session.name;
  env.uuidx = fileCache[name].uuidx;
  env.editor.setSession(session);

  // If collaboration session, clear the editor and initialize firepad
  if (fileCache[name].collab) {
    env.editor.setValue('');
    firepadRef = ref.child("collab").child(fileCache[name].collab);
    dataRef = firepadRef.child("data");
    firepad = Firepad.fromACE(firepadRef, env.editor);
    dataRef.once("value", function (data) {
      env.dat = JSON.parse(data.val()) || {};
      clearData();
      addData();
    });
    firepad.on('synced', function(isSynced) {
      getAttrVals();
      firepadRef.child("data").set(JSON.stringify(env.dat), function(error) {
        if (!error) {
          clearData();
          addData();
        }
      });
      firepadRef.child("date").set(Date());
    });
    firepadRef.on("child_changed", function(snapshot) {
      if (typeof snapshot.val() == "string" && /^\{/.test(snapshot.val())) {
        console.log("somethinghappened" + JSON.stringify(snapshot.val()))
        env.dat = JSON.parse(snapshot.val());
        clearData();
        addData();
      }
    });
  }

  env.editor.focus();
  clearData();
  addData();
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
    document.getElementById('pop_content').innerHTML = '';
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
function addTab(first, name, data, collab) {
    if (first == true) {
      var tabs = tabUL;
      var nt = document.createElement('li');
      nt.innerHTML = '<span id="cons" title="New Rule">New Rule</span> <span class="close" title="Close Tab"><i class="fa fa-times"></i></span>';
      tabs.appendChild(nt);
      activeTab('n');
      tabEvents();
      createDocument('New Rule', data, function(name) {
        swapDocument(name);
      });
    } else {
      var nt = document.createElement('li');
      if (fileCache[name]) {name += ' (1)'}
      if (fileCache[name]) {name += ' (2)'}
      nt.innerHTML = '<span id="cons" title="' + name + '">' + name + '</span> <span class="close" title="Close Tab"><i class="fa fa-times"></i></span>';
      tabUL.appendChild(nt);
      createDocument(name, data, function(name) {
        swapDocument(name);
      }, collab);
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
        getAttrVals();
        if (/document\.write/i.test(rule)) {
          conPrint('WARNING: document.write is not a valid RuleSript method. Use message.write instead.');
          rule = rule.replace(/document\.write/ig, "message.write");
        }
        var s = performance.now();
        var r = window.eval(rule);
        var e = performance.now();
        document.getElementById('exTime').innerHTML = '(' + (e - s).toFixed(4) + 'ms) <i class="fa fa-question-circle" id="time"><span class="tooltip" content="It would take ' + hm(e-s) + ' for this script to run 1 million times. This time is affected by the sandbox environment and is not an accurate representation of an Impact assembly."></span></i>';
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
            conPrint("REUSING EXISTING OFFER FOR URL: " + url);
            conPrint("\xa0\xa0\xa0\xa0INDEX: " + this.links.indexOf(url));
        } else {
            // new Offer
            conPrint("CREATING TRACKABLE LINK FOR URL: " + url);
            conPrint("\xa0\xa0\xa0\xa0LABEL: " + label);
            conPrint("\xa0\xa0\xa0\xa0DESCRIPTION: " + description);
            conPrint("\xa0\xa0\xa0\xa0CATEGORIES: " + cat1 + ", " + cat2 + ".");
            this.links.push(url);
        }
        return "<A HREF=\"redirectof:" + url + "\">" + label + "</A>";
    },
    "createTrackableArea": function (url, coords, shape, record, description) {
        if (this.areas.indexOf(url) > -1) {
            // Offer exists, re-use
            conPrint("REUSING EXITING OFFER FOR AREA: " + coords);
        } else {
            conPrint("CREATING TRACKABLE AREA FOR URL: " + url);
            conPrint("\xa0\xa0\xa0\xa0COORDINATES: " + coords);
            conPrint("\xa0\xa0\xa0\xa0SHAPE: " + shape);
            conPrint("\xa0\xa0\xa0\xa0DESCRIPTION: " + description + ".");
            this.links.push(coords);
        }
        return url;
    },
    "get": function (varName) {
        if (env.dat.msgvar[varName] !== undefined) {
            conPrint("RETRIEVING MESSAGE VARIABLE: " + varName + " = " + JSON.stringify(env.dat.msgvar[varName]));
            return env.dat.msgvar[varName];
        } else {
            conPrint("WARNING: Message variable " + varName + " is not set.");
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
        if (env.dat['Part Format']) {
            return env.dat['Part Format'];
        } else {
            conPrint( "WARNING: Part Format is undefined - the sandbox will assume HTML to keep parsing.");
            return 'HTML';
        }
    },
    "getSendMode": function () {
        if (env.dat['Send Mode']) {
            return env.dat['Send Mode'];
        } else {
            conPrint( "WARNING: Part Format is undefined - the sandbox will assume normal to keep parsing.");
            return 'normal';
        }
    },
    "isSet": function (varName) {
        return env.dat.msgvar[varName] !== undefined;
    },
    "set": function (varName, newVal) {
        // if this[ varName ] DNE, it will be created and defined with the value newVal
        // if this[ varName ] exists, the value will be overwritten with newVal
		if (typeof newVal == "object") {
				conPrint("SETTING MESSAGE VARIABLE: " + varName + " = " + JSON.stringify(newVal));
		} else {
			conPrint("SETTING MESSAGE VARIABLE: " + varName + " = " + newVal);
		}
        env.dat.msgvar[varName] = newVal;
    },
    "setHeaderFromRuleScript": function (header, value) {
        conPrint("SETTING HEADER <" + header + "> FROM RULESCRIPT. ");
        conPrint("\xa0\xa0\xa0\xa0VALUE: " + value);
    },
    "setMimeCharset": function (value) {
        conPrint("SETTING MIME CHARSET FROM RULESCRIPT.");
        conPrint("\xa0\xa0\xa0\xa0VALUE: " + value);
        this.mimeCharset = value;
    },
    "getMimeCharset": function () {
        if (this.mimeCharset) {
            conPrint("GETTING MIME CHARSET FROM RULESCRIPT.");
            conPrint("\xa0\xa0\xa0\xa0VALUE: " + this.mimeCharset);
            return this.mimeCharset;
        } else {
            // prompt for value and whether or not to keep it stored
            var newVal = prompt("Please enter a MIME Charset.") || null;
            this.mimeCharset = newVal;
            return newVal;
        }
    },
    "stopSending": function (error) {
        conPrint("ERROR - HALTING ASSEMBLY: " + error);
    },
    "write": function (message) {
        conPrint("WRITE TO EMAIL: " + message);
    }
};

var userdata = {
    "get": function (attrib) {
        if (env.dat && env.dat[attrib]) {
            return env.dat[attrib];
        } else if (env.dat[attrib] === undefined) {
            conPrint( "WARNING: Value for attribute " + attrib + " is undefined.");
            return 'undefined';
        } else {
          return env.dat[attrib];
        }
    },
    "set": function (newObj) {
        env.dat = newObj;
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
            conPrint("WARNING: util.search is not a well documented method. Try using string.match(regexp) instead.");
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
        conPrint("PARSING DI STRING: " + input);
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
        if (env.dat[varName] !== undefined) {
            conPrint("RETRIEVING CELL VARIABLE: " + varName + " = " + JSON.stringify(env.dat[varName]));
            return env.dat[varName];
        } else {
            message.stopSending("Cell Variable " + varName + " is not set.");
        }
    },
    "getTrackingCode": function () {
        if (env.dat["Tracking Code"] !== undefined) {
            return env.dat["Tracking Code"];
        } else {
            conPrint("WARNING: Tracking Code field is undefined.");
            return '';
        }
    },
    "getCellName": function () {
        if (env.dat['Cell Name']) {
            return env.dat['Cell Name'];
        } else {
          conPrint("WARNING: Cell Name field is undefined - proceeding with 'Cell Name' to continue parsing.");
          return 'Cell Name';
        }
    },
    "getCampaignId": function () {
        if (env.dat["Campaign ID"]) {
            return env.dat["Campaign ID"];
        } else {
          // generate random 11 digit number
          var newVal = Math.floor(10000000000 + Math.random() * 1100000000);
          this["Camppaign ID"] = newVal;
          return newVal;
        }
    },
    "isFTAF": function () {
        if (env.dat.FTAF) {
            return env.dat.FTAF;
        } else {
          conPrint("WARNING: FTAF field is undefined - assuming false to continue parsing.");
          return false;
        }
    },
    "isSet": function (varName) {
        return env.dat[varName] !== undefined;
    },
    "set": function (varName, newVal) {
        // if this[ varName ] DNE, it will be created and defined with the value newVal
        // if this[ varName ] exists, the value will be overwritten with newVal
        conPrint("SETTING CELL VARIABLE: " + varName + " = " + JSON.stringify(newVal));
        env.dat[varName] = newVal;
    },
    "setTrackingCode": function (code) {
        conPrint("SETTING TRACKING CODE: " + code);
        env.dat['Tracking Code'] = code;
    },
    "setCellName": function (code) {
        conPrint("SETTING CELL NAME: " + code);
        env.dat['Cell Name'] = code;
    }
};

var contentLibrary = {
    "show": function (component) {
        conPrint("DISPLAYING COMPONENT: " + component);
    },
    "showRandom": function (contentNames) {
        var idx = Math.floor(Math.random() * (contentNames.length));
        conPrint("DISPLAYING RANDOM COMPONENT " + idx + ": " + contentNames[idx]);
    }
};

var inputAttributes = {
    "get": function (ia) {
      if (env.dat && env.dat[ia]) {
          if (/[a-z]/.test(ia)) {
            conPrint( "WARNING: Value for input attribute '" + ia + "' contains lowercase characters that will not work in Impact.");
          }
          return env.dat[ia];
      } else if (env.dat[ia] === undefined) {
          conPrint( "WARNING: Value for input attribute " + ia + " is undefined.");
          return 'undefined';
      } else {
        if (/[a-z]/.test(ia)) {
          conPrint( "WARNING: Value for input attribute '" + ia + "' contains lowercase characters that will not work in Impact.");
        }
        return env.dat[ia];
      }
    },
    "set": function (newObj) {
        env.dat = newObj;
    }
};

/* FIREPAD FOR COLLABORATION?
***********************************************************/
function fireThis(collab) {
  var id = (collab) ? collab : guidGenerator();
  addTab(false, "Collab Tab ("+id+")",null,id);
  if (!collab) {
    window.location.hash = id;
    buildQueryString(false,id);
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
// Init first tab
addTab(true);

// If there is a query string, then use it for the initial code value
var qs = getQueryString();
if (qs.id) {
	uuidx = qs.id
	var versionArray = []
	var idRef = ruleRef.child(qs.id) //set firbase reference for the correct ID
	idRef.once("value", function (data) { //get snapshot of data
		console.log(data.val().version)
		data = data.val().version;
		for (var version in data) {
			data[version].version = version; // save key for future retrieval
			versionArray.push(data[version]);
		}
		versionArray.sort(function (a, b) {
			return (moment(a.date).unix() + moment(b.date).unix());
		});
    addTab(false, versionArray[0].name, JSON.parse(atob(versionArray[0].data)));
    env.dat = JSON.parse(atob(versionArray[0].data));
	env.editor.setValue(atob(versionArray[0].code));
    addData();
	});
	//env.editor.setValue(qs.code);
}

if (window.location.hash) {
  fireThis(window.location.hash.replace(/#/, ''));
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
    name: "New Attribute",
    bindKey: "Alt+d",
    exec: function (editor) {
        dataPop(false);
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
document.getElementById("add_data").addEventListener("click", function() { dataPop(false)});
document.getElementById("con_reset").addEventListener("click", clearConsole);
document.getElementById("data_reset").addEventListener("click", function() {clearData(true)});
document.getElementById("search_attrs").addEventListener("click", function() {findAttr()});
document.getElementById("run").addEventListener("click", exRule);
document.getElementById("pop_close").addEventListener("click", closePop);
//document.getElementById("link").addEventListener("click", buildQueryString);
document.getElementById("link").addEventListener("click", function () {
	saveToFirebase(env.uuidx);
	//console.log("uuid: " + uuidx)
});
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
  } else if (e.which == 27 || e.keyCode == 27) {
    closePop();
  }
});
}
function popDataEvents () {
document.getElementById("tsubmit").addEventListener("click", function(){
  var val = document.getElementById('pop_in_tab').value;
  if (!val) {
    dataPop('empty');
  } else if (typeof env.dat[val] === "undefined"){
    addData(val);
    closePop();
  } else {
    dataPop(true);
  }
});
document.getElementById("pop_in_tab").addEventListener("keydown", function(e){
  var val = document.getElementById('pop_in_tab').value;
   if (e.which == 13 || e.keyCode == 13) {
    if (!val) {
       dataPop('empty');
    } else if (typeof env.dat[val] === "undefined"){
      addData(val);
      closePop();
    } else {
      dataPop(true);
    }
  } else if (e.which == 27 || e.keyCode == 27) {
    closePop();
  }
});
}

var ed = document.getElementById("editor");
ed.addEventListener('dragover', handleDragOver, false);
ed.addEventListener('drop', handleFileSelect, false);
tabEvents();
