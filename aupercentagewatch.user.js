// ==UserScript==
// @name          AU Answered Questions Percentage Watcher
// @author        rlemon
// @version       0.3.1
// @namespace     rlemon.com
// @description   Gives you periodic updates as to the Percentage of answered questions on Ask Ubuntu
// @include       *
// ==/UserScript==

function embed_function_contents_on_page(func) {
	var script_tag = document.createElement('script'),
		fs = func.toString();
	script_tag.textContent = fs.substring(fs.indexOf("{") + 1, fs.lastIndexOf("}"));
	document.head.appendChild(script_tag);
}
embed_function_contents_on_page(function() { 
		/* set to true for debugging */
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
	var create_cookie = function(name, value, minutes) {
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
	var read_cookie = function(name) {
		var name_eq = name + '=';
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') c = c.substring(1, c.length);
			if (c.indexOf(name_eq) == 0) return c.substring(name_eq.length, c.length);
		}
		return null;
	};

	function apply_styles(elm, style_object) {
		for (prop in style_object) {
			elm.style[prop] = style_object[prop];
		}
	}

	function fade_out(element, callback) {
		if (element.style.opacity && element.style.opacity > 0.05) {
			element.style.opacity = element.style.opacity - 0.05;
		} else if (element.style.opacity && element.style.opacity <= 0.1) {
			callback.call(element);
		} else {
			element.style.opacity = 0.9;
		}
		to1 = setTimeout(function() {
			fade_out(element, callback);
		}, 1000 / 30);
	}

	function run_popup(value) {
		var container = document.createElement('div');
		var txt = document.createElement('div');
		txt.style.display = "inline-block";
		txt.style.verticalAlign = "middle";
		txt.style.padding = "0 12px";
		txt.appendChild(document.createTextNode(value + '%'));
		container.onmouseover = function() {
			apply_styles(container, popup_css.notification_styles_hover);
		};
		container.onmouseout = function() {
			apply_styles(container, popup_css.notification_styles);
		};
		container.onclick = function() {
			this.style.display = 'none';
		}
		container.onmouseout();
		container.appendChild(txt);
		document.body.appendChild(container);
		to2 = setTimeout(function() {
			fade_out(container, function() {
				if (this.parentNode) {
					this.parentNode.removeChild(this);
				}
			});
		}, 5 * 1000);
	}

	function run_loop(show_message) {
		if (!read_cookie('au_answered_percent') || read_cookie('au_answered_percent') != au_answered_percent) {
			create_cookie('au_answered_percent', au_answered_percent, timeout_in_minutes);
			show_message = true;
		}
		if (show_message) {
			run_popup(au_answered_percent);
		}
		to3 = setTimeout(function() {
			run_loop(false);
		}, 10 * 1000);
	}

	function set_data(data) {
		au_answered_percent = Math.round(100 - (data.statistics[0].total_unanswered / data.statistics[0].total_questions * 100));
		to4 = setTimeout(function() {
			jsonp("http://api.askubuntu.com/1.1/stats?jsonp=set_data");
		}, 60 * 1000);
	}

	function first_load(data) {
		set_data(data);
		run_loop(display_on_page_load);
	}

	(function() {
		jsonp("http://api.askubuntu.com/1.1/stats?jsonp=first_load");
	}());
});
