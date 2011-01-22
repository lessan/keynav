/*
 * jQuery Keyboard Navigation Plugin
 * http://github.com/lessan/keynav
 *
 * Based upon the plugin by Mike Hostetler
 * http://mike-hostetler.com/jquery-keyboard-navigation-plugin
 */

(function($) {
    // Method calling logic
    $.fn.keynav = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === "object" || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error("Method " + method + " does not exist on jQuery.keynav");
        }
    }
    var _options = {};
    $.fn.keynav.defaultOptions = {
        enabled: true,
        group: "keynav1",
        focusClass: "focused",
		validateAction : function(element, direction) {
			// if the cursor is currently in the middle of a textarea, 
			//    let the default action take place (i.e. skip keynav)
			if ($(element).is("textarea")) {
				var offsets = getInputOffsets(element);
				if (direction == "up" && !offsets.atStart)
					return false;
				if (direction == "down" && !offsets.atEnd)
					return false;
			}
			return true;
		}
    }

    // Public methods
    var methods = {
        init: function(options) {
            if (this.length == 0) return this;

            _options = $.extend($.fn.keynav.defaultOptions, options);

            // Only bind keyboard handlers once
            if (_initialized != true) {
                _bindKeyboardEventHandlers();
                _initialized = true;
            }

            // Register items
            methods.add(_options.group, this);

            return this;
        },

        /* (re)sort items in a given group */
        sort: function(group, items) {
            if (group == undefined) group = _options.group;
            if (items == undefined)
                items = $("." + group);
            _sortItems(items);
            _saveSortOrder(items, group);
            return this;
        },

        /* add an item or items to a given group */
        add: function(group, items) {
            if (items == undefined) items = this;
            if (group == undefined) group = _options.group;
            _registerItems(items, group);
            methods.sort(group);
            return this;
        },

        /* unregister an item or items from a given group */
        del: function(group, items) {
            if (items == undefined) items = this;
            if (group == undefined) group = _options.group;
            var affected = 0;
            $(items).each(function() {
                var item = $(this);

                // only unregister if the item belongs to the specified group
                if (!item.hasClass(group)) return;

                // move the focus down before removing this item
                if (item.hasClass(_options.focusClass))
                    if (_changeFocus("down", group) == false)
                        // or up, if the down move didn't work (i.e. already at the last element)
                        _changeFocus("up", group);

                _unregisterItems(this, group);
                affected++;
            });
            if (affected == 0) return false;
            methods.sort(group);
            return this;
        },

        /* unregister an item or items, and also remove the elements from the DOM */
        remove: function() {
            if (methods.del(_options.group, this) !== false)
                this.remove();
        },

        /* move the focus "up" or "down" */
        navigate: function(direction, group) {
            if (group == undefined) group = _options.group;
            _changeFocus(direction, group);
            return this;
        },

        /* activate an element */
        activate: function(dontTriggerFocus, items, group) {
            if (items == undefined) items = this;
            if (group == undefined) group = _options.group;
            _setFocusToItem($(items), _getCurrentItem(group), dontTriggerFocus);
            return this;
        },

        /* change active group */
        activateGroup: function(group) {
            if (group == undefined) return;
            _options.group = group;
            return this;
        },

        /* get active group */
        currentGroup: function() {
            return _options.group;
        },

        /* disable all keyboard navigation */
        disable: function() {
            _options.enabled = false;
            return this;
        },

        /* enable all keyboard navigation */
        enable: function() {
            _options.enabled = true;
            return this;
        },

        /* get enabled status */
        enabled: function() {
            return _options.enabled;
        }

    };


    /* private methods */
    var _initialized = false;

    function _bindKeyboardEventHandlers() {
        $(document).bind("keydown", function(event) {
            if (_options.enabled != true) return;

            var key = event.keyCode;
            if (key == 38) // up arrow
            {
				if (_options.validateAction(event.target, "up") != true) return;
                methods.navigate("up", _options.group);
                event.preventDefault();
            }
            if (key == 40) // down arrow
            {
                if (_options.validateAction(event.target, "down") != true) return;
                methods.navigate("down", _options.group);
                event.preventDefault();
            }
        });
    }

    function _getCurrentItem(group) {
        var result = $("." + group + "." + _options.focusClass);
        if (result.length == 0)
            result = _getItemAtIndex(0, group);
        return result;
    }

    function _getCurrentItemIndex(curItem, group) {
        var result = curItem.attr("data-" + group + "-position");
        result = parseInt(result);
        if (isNaN(result)) result = -1;
        return result;
    }

    function _getItemAtIndex(index, group) {
        return $("." + group + "[data-" + group + "-position=" + index + "]");
    }

    function _changeFocus(direction, group) {
        var curItem = _getCurrentItem(group);
        var curIndex = _getCurrentItemIndex(curItem, group);

        if (curIndex < 0) return;

        if (direction == "up") newIndex = curIndex - 1;
        if (direction == "down") newIndex = curIndex + 1;

        var newItem = _getItemAtIndex(newIndex, group);
        if (newItem.length == 1) {
            _setFocusToItem(newItem, curItem);
            return true;
        }
        return false;
    }

    function _setFocusToItem(item, oldItem, dontTriggerFocus) {
        oldItem.removeClass(_options.focusClass);
        item.addClass(_options.focusClass);
        if (dontTriggerFocus != true)
            item.focus();
    }

    function _registerItems(items, group) {
        $(items).addClass(group);
    }

    function _unregisterItems(items, group) {
        $(items).removeClass(group + " " + _options.focusClass).removeAttr("data-" + group + "-position");
    }

    function _sortItems(items) {
        $(items).get().sort(function(a, b) {
            var compA = $(a).offset().top;
            var compB = $(b).offset().top;
            return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
        });
    }

    function _saveSortOrder(items, group) {
        $.each(items, function(index, item) {
            $(item).attr("data-" + group + "-position", index);
        });
    }


})(jQuery);



function getInputOffsets(el) {
    var atStart = false, atEnd = false;

    if (typeof (el.value) == "string")
        if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        var start = el.selectionStart;
        var end = el.selectionEnd;
        var len = el.value.length;
        if (start == 0)
            atStart = true;
        if (end == len)
            atEnd = true;
    } else {
        var ieOffsets = getInputOffsetsIE(el);
        if (ieOffsets.atTopRow)
            atStart = true;
        if (ieOffsets.atBottomRow)
            atEnd = true;
    }

    return {
        atStart: atStart,
        atEnd: atEnd
    };
}

function getInputOffsetsIE(el) {
    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        start = el.selectionStart;
        end = el.selectionEnd;
    }

    if (!document.selection)
        alert("Error in javascript - this code only valid for IE");

    var range,
        atStart = false, atEnd = false,
        atTopRow = false, atBottomRow = false;
    range = document.selection.createRange();

    if (range && range.parentElement() == el) {
        // Get the offsets of the selected range
        var selectionOffsetLeft = range.offsetLeft;
        var selectionOffsetTop = range.offsetTop;

        // Create a temporary TextRange object
        // By default it surrounds the contents of the element
        var textInputRange = el.createTextRange();
        var startOffsetLeft = textInputRange.offsetLeft;
        var startOffsetTop = textInputRange.offsetTop;

        // Collapse(false) moves the start point to the end of the range
        textInputRange.collapse(false);
        var endOffsetLeft = textInputRange.offsetLeft;
        var endOffsetTop = textInputRange.offsetTop;

        if (startOffsetLeft == selectionOffsetLeft &&
            startOffsetTop == selectionOffsetTop)
            atStart = true;
        if (endOffsetLeft == selectionOffsetLeft &&
            endOffsetTop == selectionOffsetTop)
            atEnd = true;
        if (startOffsetTop == selectionOffsetTop)
            atTopRow = true;
        if (endOffsetTop == selectionOffsetTop)
            atBottomRow = true;
   }

    return {
        atStart: atStart,
        atEnd: atEnd,
        atTopRow: atTopRow,
        atBottomRow: atBottomRow
    };
}