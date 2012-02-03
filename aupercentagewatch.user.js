// ==UserScript==
// @name          AU Answered Questions Percentage Watcher
// @author        rlemon
// @version       0.3
// @namespace     rlemon.com
// @description   Gives you periodic updates as to the Percentage of answered questions on Ask Ubuntu
// @include       *
// ==/UserScript==

function EmbedFunctionContentsOnPage(func) {
    var script_tag = document.createElement('script'),
        fs = func.toString();
    script_tag.textContent = fs.substring(fs.indexOf("{") + 1, fs.lastIndexOf("}"));
    document.head.appendChild(script_tag);
}
EmbedFunctionContentsOnPage(function() { /* set to true for debugging */
    var display_on_page_load = false,
        /* minmum of 0.5 minutes */
        timeout_in_minutes = 5,
        /* here be dragons */
        popup_css = {
            notification_styles: {
                position: 'fixed',
                top: '12px',
                right: '12px',
                zIndex: '9999',
                padding: "18px",
                margin: "0 0 6px 0",
                backgroundColor: "#000",
                opacity: 0.8,
                cursor: 'pointer',
                color: "#fff",
                font: "bold 26px 'Lucida Sans Unicode', 'Lucida Grande', Verdana, Arial, Helvetica, sans-serif",
                borderRadius: "3px",
                boxShadow: "#999 0 0 12px"
            },
            notification_styles_hover: {
                opacity: 1,
                boxShadow: "#000 0 0 12px"
            }
        },
        au_answered_percent, to1, to2, to3, to4;

    function jsonp(url) {
        var script_tag = document.createElement('script');
        script_tag.src = url;
        document.body.appendChild(script_tag);
    }
    var createCookie = function(name, value, minutes) {
        var expires;
        if (minutes) {
            var date = new Date();
            date.setTime(date.getTime() + (minutes * 60 * 1000));
            expires = '; expires=' + date.toGMTString();
        } else {
            expires = '';
        }
        document.cookie = name + '=' + value + expires + '; path=/';
    };
    var readCookie = function(name) {
        var nameEQ = name + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    function applyStyles(elm, styleObject) {
        for (prop in styleObject) {
            elm.style[prop] = styleObject[prop];
        }
    }

    function fadeout(element, callback) {
        if (element.style.opacity && element.style.opacity > 0.05) {
            element.style.opacity = element.style.opacity - 0.05;
        } else if (element.style.opacity && element.style.opacity <= 0.1) {
            callback.call(element);
        } else {
            element.style.opacity = 0.9;
        }
        to1 = setTimeout(function() {
            fadeout(element, callback);
        }, 1000 / 30);
    }

    function runpopup(value) {
        var container = document.createElement('div');
        var txt = document.createElement('div');
        txt.style.display = "inline-block";
        txt.style.verticalAlign = "middle";
        txt.style.padding = "0 12px";
        txt.appendChild(document.createTextNode(value + '%'));
        container.onmouseover = function() {
            applyStyles(container, popup_css.notification_styles_hover);
        };
        container.onmouseout = function() {
            applyStyles(container, popup_css.notification_styles);
        };
        container.onclick = function() {
            this.style.display = 'none';
        }
        container.onmouseout();
        container.appendChild(txt);
        document.body.appendChild(container);
        to2 = setTimeout(function() {
            fadeout(container, function() {
                if (this.parentNode) {
                    this.parentNode.removeChild(this);
                }
            });
        }, 5 * 1000);
    }

    function runloop(showMessage) {
        if (!readCookie('au_answered_percent') || readCookie('au_answered_percent') != au_answered_percent) {
            createCookie('au_answered_percent', au_answered_percent, timeout_in_minutes);
            showMessage = true;
        }
        if (showMessage) {
            runpopup(au_answered_percent);
        }
        to3 = setTimeout(function() {
            runloop(false);
        }, 10 * 1000);
    }

    function set_data(data) {
        au_answered_percent = Math.round(100 - (data.statistics[0].total_unanswered / data.statistics[0].total_questions * 100));
        to4 = setTimeout(function() {
            jsonp("http://api.askubuntu.com/1.1/stats?jsonp=set_data");
        }, 60 * 1000);
    }

    function pageLoad(data) {
        set_data(data);
        runloop(display_on_page_load);
    }

    (function() {
        jsonp("http://api.askubuntu.com/1.1/stats?jsonp=pageLoad");
    }());
});
