// Hive Layout Framework
// Copyright (C) 2008-2012 Hive Solutions Lda.
//
// This file is part of Hive Layout Framework.
//
// Hive Layout Framework is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Hive Layout Framework is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Hive Layout Framework. If not, see <http://www.gnu.org/licenses/>.

// __author__    = João Magalhães <joamag@hive.pt>
// __version__   = 1.0.0
// __revision__  = $LastChangedRevision$
// __date__      = $LastChangedDate$
// __copyright__ = Copyright (c) 2010-2012 Hive Solutions Lda.
// __license__   = GNU General Public License (GPL), Version 3

(function(jQuery) {
    jQuery.fn.ulinksextra = function(options) {
        // the default values for the pos customer
        var defaults = {};

        // sets the default options value
        var options = options ? options : {};

        // constructs the options
        var options = jQuery.extend(defaults, options);

        // sets the jquery matched object
        var matchedObject = this;

        /**
         * Initializer of the plugin, runs the necessary functions to initialize
         * the structures.
         */
        var initialize = function() {
            _appendHtml();
            _registerHandlers();
        };

        /**
         * Creates the necessary html for the component.
         */
        var _appendHtml = function() {
            // retrieves the reference to the element
            // to be used in the construction of the
            // extra links menu
            var linkMore = jQuery(".link-more");
            var links = linkMore.parents(".links");
            var linksElements = jQuery("> a", links);

            // retrieves the size of the complete set of
            // link element present in the current menu links
            // bar and uses the size to retrieve the before
            // last element (element to be replaced)
            var size = linksElements.length;
            var element = size > 2 ? linksElements[size - 2] : null;

            // tries to retrieve the current active link for
            // the extra links menu in case it exists replaces
            // the element with the one before last (menu element
            // swith) so that it becomes visible
            var activeLink = jQuery("a.active", matchedObject);
            var activeItem = activeLink.parent("li");
            if (activeLink.length != 0) {
                activeLink.insertAfter(element);
                activeItem.append(element);
            }

            // retrieves both the width of the extra links menu
            // and the width of the more link element then calculates
            // the extra width to be deduces using margin and applies
            // the value to the matched object (menu alignment)
            var width = matchedObject.outerWidth(true);
            var linkMoreWidth = linkMore.outerWidth(true);
            var extraWidth = (width - linkMoreWidth) * -1;
            matchedObject.css("margin-left", extraWidth + "px");
        };

        /**
         * Registers the event handlers for the created objects.
         */
        var _registerHandlers = function() {
            // retrieves the references to the various elements
            // for which event handlers will be registered
            var _document = jQuery(document);
            var linkMore = jQuery(".link-more");
            var links = jQuery("a", matchedObject);

            // registers for the hide event on the matched object
            // in order to hide the element and remove the hover
            // state from the associated link
            matchedObject.bind("hide", function() {
                        var element = jQuery(this);
                        var isVisible = element.is(":visible");
                        if (!isVisible) {
                            return;
                        }
                        var link = element.data("link");
                        link.removeClass("hover");
                        element.css("display", "none");
                    });

            // registers for the click event on the more link
            // to show the extra links or hide them
            linkMore.click(function(event) {
                        var element = jQuery(this);
                        var linksExtra = jQuery(".links-extra");
                        var isVisible = linksExtra.is(":visible");

                        if (isVisible) {
                            element.removeClass("hover");
                            linksExtra.css("display", "none");
                        } else {
                            element.addClass("hover");
                            linksExtra.css("display", "inline");
                            linksExtra.data("link", element);
                        }

                        event.stopPropagation();
                        event.preventDefault();
                    });

            // registers for the click event on the internal
            // links to avoid the event propagation
            links.click(function(event) {
                        event.stopPropagation();
                    });

            // registers for the click event on the document
            // to hide the current extra links menu
            _document.click(function() {
                        var element = jQuery(this);
                        matchedObject.triggerHandler("hide");
                    });
        };

        // initializes the plugin
        initialize();

        // returns the object
        return this;
    };
})(jQuery);

jQuery(document).ready(function() {
            jQuery(".links-extra").ulinksextra();
        });
