(function($) {
	function Include(node, options, processor) {
		var include = $.extend(this, options), context;

		function undo() {
			context = context.replaceWith(node);
			include.redo = redo;
			include.undo = function() {};
		}
		function redo() {
			processor.load(include.file, function(html) {
				context = $(node).replaceWith(html);
				include.redo = function() {};
				include.undo = undo;
			});
		}
		redo();

		return include;
	}

	function Processor($$) {
		var processor = this, commands = [], loading = 0, loaded = 0;

		function parseOptions(string) {
			var options = {}, tmp, key;
			while ((tmp = string.split('="', 2)).length > 1) {
				key = tmp[0];
				tmp = tmp[1].split('"', 2);
				options[key] = tmp[0];
				string = tmp[1];
			}
			return options;
		}
		function dispatcher(_, commandName, optionsString) {
			var options = parseOptions(optionsString), command;

			switch(commandName) {
				case 'include' :
				command = new Include(this, options, processor);
				break;
				default: throw('unknown command');
			}

			commands.push(command);
		}
		function process() {
			switch (this.nodeType) {
				case 8 :
				var match = this.nodeValue.match(/^#\s*(\w+) (.+)/);
				if (match) dispatcher.apply(this, match);
				break;
				case 1 : $(this).contents().each(process);
			}
		}
		this.process = function() {
			$$.contents().each(process);
		};

		this.load = function(value, callback) {
			loading++;
			$.get(value, function(data) {
				callback(data);
				if (loading == ++loaded) processor.done();
			});
		};
		if (loading == 0) processor.done();

		this.reset = function() {
			_.each(commands, function(c) { c.undo(); });
		};

		return processor;
	}
	Processor.prototype.done = function() {};

	$.fn.bcome = function(options) {
		var processor = new Processor(this);
		$.extend(processor, options).process();

		return this.data('bcome', processor);
	};
})(jQuery);
