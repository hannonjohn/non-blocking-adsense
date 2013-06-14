var domWrite = (function () {
	var originalDocumentWrite = document.write;
	var domWriters = [];
	var timeout;
	var regexForScript = /<script[^>]*>([\s\S]*?)<\/script>/gi;
	var regexForSrc = /src=[\'|\"]+([^'"]+)[\'|\"]+/gi;

	var States = {
		Idle: 0,
		Waiting: 1,
		Running: 2
	};

	//Controller manages multiple domWrite() calls on the page
	var Controller = Backbone.Model.extend({
		defaults: { State: States.Idle },
		callStack: [],
		initialize: function () {
			_.bindAll(this);
			this.on("change:State", this.stateChanged);
		},
		stateChanged: function (model, state) {
			if (state === States.Idle) {
				this.fireNextCall();
			}
		},
		isIdle: function () {
			return this.get("State") === States.Idle;
		},
		setState: function (state) {
			this.set("State", state);
		},
		fireNextCall: function () {
			if (this.callStack.length > 0) {
				this.callStack.shift()();
			}
		},
		addToCallStack: function (call) {
			this.callStack.push(call);
		}
	});

	var controller = new Controller;

	function startNext() {
		if (domWriters.length > 0) domWriters[0].start();
	}

	function evalScripts(data) {
		var scripts = [];
		var script;

		while ((script = regexForScript.exec(data))) {
			if (script) scripts.push(script[1]);
		}

		scripts = scripts.join("\n");

		if (scripts) {
			eval(scripts);
			return true;
		}

		return false;
	}

	function haveScriptsWithSrc(data) {
		var foundScriptsWithSrc = data.match(regexForScript) && data.match(regexForSrc);
		regexForScript.lastIndex = 0;
		regexForSrc.lastIndex = 0;
		return foundScriptsWithSrc;
	}

	function finish(currentDOMWriter) {
		domWriters.shift();
		var data = currentDOMWriter.buffer;

		if (haveScriptsWithSrc(data)) {
			var src;
			while ((src = regexForSrc.exec(data))) {
				addNewDOMWriter(currentDOMWriter.container, src[1], null);
			}
		} else {
			currentDOMWriter.container.innerHTML = currentDOMWriter.buffer;
			var scriptsFound = evalScripts(data);
			if (!scriptsFound) controller.setState(States.Idle);
		}

		document.write = originalDocumentWrite;
		window.setTimeout(startNext, 50);
	}

	function checkDone(currentDOMWriter) {
		var domWriterRef = currentDOMWriter;
		return function () {
			if (domWriterRef.buffer !== domWriterRef.oldBuffer) {
				domWriterRef.oldBuffer = domWriterRef.buffer;
				timeout = window.setTimeout(checkDone(domWriterRef), domWriterRef.delay);
			} else finish(domWriterRef);
		};
	}

	function DOMWriter(container, scriptSrc, settingsFunction) {
		this.container = (typeof container == "string" ? document.getElementById(container) : container);
		this.settingsFunction = settingsFunction || function () { };
		this.scriptSrc = scriptSrc;
		this.buffer = "";
		this.oldBuffer = "";
		this.delay = 100;
	}

	DOMWriter.prototype = {
		start: function () {
			controller.setState(States.Waiting);
			var domWriter = this;
			domWriter.settingsFunction.apply(window);

			document.write = (function () {
				var domWriterRef = domWriter;
				var callback = checkDone(domWriterRef);

				return function (val) {
					window.clearTimeout(timeout);
					controller.setState(States.Running);
					domWriterRef.oldBuffer = domWriterRef.buffer;
					domWriterRef.buffer += val;
					timeout = window.setTimeout(callback, domWriterRef.delay);
				};
			})();

			addScriptToHead(domWriter.scriptSrc);
		}
	};

	function addScriptToHead(scriptSrc) {
		var script = document.createElement("script");
		script.setAttribute("src", scriptSrc);
		document.getElementsByTagName("head")[0].appendChild(script);
	}

	function addNewDOMWriter(container, scriptSrc, settingsFunction) {
		var domWriter = new DOMWriter(container, scriptSrc, settingsFunction);
		domWriters.push(domWriter);
	}

	return function (container, scriptSrc, settingsFunction) {
		var callToAddNewWriter = function () { addNewDOMWriter(container, scriptSrc, settingsFunction); };

		if (controller.isIdle()) {
			callToAddNewWriter();
			startNext();
		}
		else controller.addToCallStack(callToAddNewWriter);
	};
})();