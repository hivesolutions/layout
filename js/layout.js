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

            // tries to retrieve the complete set of extra links
            // that were selected and in case the ammount is zero
            // the link more section is hidden (not necessary)
            var linksExtra = jQuery("li", matchedObject);
            var extraSize = linksExtra.length;
            if (extraSize == 0) {
                linkMore.hide();
            }

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
            var linkMore = jQuery(".link-more > .link");
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

(function(jQuery) {
    jQuery.fn.ufluid = function(options) {
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
            // validates that there's a valid matched object,
            // otherwise returns immediately
            if (matchedObject.length == 0) {
                return;
            }

            // retrieves the refereces to the various inner elements
            // of the fluid layout that are going to be updated
            var sideLinks = jQuery(".side-links", matchedObject);
            var contentContainer = jQuery(".content-container", matchedObject);

            // runs the initial laout operation so that the current
            // panel is display with the correct dimensions
            _layout(matchedObject, options);

            // updates the side links so that it's initial visibility
            // is set accordingly and then sets the contents container
            // as a border box oriented panel (better size measurements)
            sideLinks.data("visible", true);
            contentContainer.addClass("border-box");
        };

        /**
         * Registers the event handlers for the created objects.
         */
        var _registerHandlers = function() {
            // validates that there's a valid matched object,
            // otherwise returns immediately, no registration done
            if (matchedObject.length == 0) {
                return;
            }

            // retrieves the reference to the various elements that
            // are going to be used for event handler registration
            var _window = jQuery(window);
            var topBar = jQuery(".top-bar", matchedObject);
            var sideLinks = jQuery(".side-links", matchedObject);
            var logoLink = jQuery(".logo > a", topBar);

            // registers for the click event on the logo link element
            // so that the side links visibility is changed
            logoLink.click(function() {
                        sideLinks.triggerHandler("toggle");
                    });

            // registers for the toggle event in the side links so that
            // their visibility is changed according to the current state
            sideLinks.bind("toggle", function() {
                        var element = jQuery(this);
                        var isVisible = element.data("visible");
                        if (isVisible) {
                            element.triggerHandler("hide");
                        } else {
                            element.triggerHandler("show");
                        }
                    });

            // registers for the show event so that the side links
            // are properly shown in the current display container
            sideLinks.bind("show", function() {
                        var element = jQuery(this);
                        var isVisible = element.data("visible");
                        if (isVisible) {
                            return;
                        }
                        element.data("visible", true);
                        element.show();
                        var duration = _isFixed() ? 0 : 350;
                        element.animate({
                                    left : 0
                                }, {
                                    duration : duration,
                                    easing : "swing",
                                    complete : function() {
                                        _layout(matchedObject, options);
                                    },
                                    progress : function() {
                                        _layout(matchedObject, options);
                                    }
                                });
                    });

            // registers for the hide event so that the side links
            // are properly hidden from the current display container
            sideLinks.bind("hide", function() {
                        var element = jQuery(this);
                        var isVisible = element.data("visible");
                        if (!isVisible) {
                            return;
                        }
                        element.data("visible", false);
                        var width = element.outerWidth(true);
                        var duration = _isFixed() ? 0 : 350;
                        console.info(_isFixed());
                        element.animate({
                                    left : width * -1
                                }, {
                                    duration : duration,
                                    easing : "swing",
                                    complete : function() {
                                        element.hide();
                                        _layout(matchedObject, options);
                                    },
                                    progress : function() {
                                        _layout(matchedObject, options);
                                    }
                                });
                    });
        };

        var _layout = function(element, options) {
            // retrieves the reference to the various elements that are going
            // to have their layout update, or that are going to be used as
            // reference for the various layout calculus operations
            var sideLinks = jQuery(".side-links", matchedObject);
            var content = jQuery(".content", matchedObject);

            // calculates the proper side links width, taking into account
            // the complete set of possibilities for it's visibility, like
            // the current left position and the visibility of it
            var sideLinksVisible = sideLinks.is(":visible");
            var sideLinksWidth = sideLinks.outerWidth(true);
            var sideLinksLeft = sideLinks.css("left");
            sideLinksLeft = parseInt(sideLinksLeft);
            sideLinksLeft = sideLinksLeft ? sideLinksLeft : 0;
            sideLinksWidth += sideLinksLeft;
            sideLinksWidth = sideLinksVisible ? sideLinksWidth : 0;

            // updates the margin left property of the content panel
            // with the proper width of the side links so that no overlap
            // exists between both panels (as expected)
            content.css("margin-left", sideLinksWidth + "px");
        };

        var _isFixed = function() {
            var _body = jQuery("body");
            return _body.hasClass("fixed");
        };

        // initializes the plugin
        initialize();

        // returns the object
        return this;
    };
})(jQuery);

jQuery(document).ready(function() {
            // retrieves the reference to the links extra element and runs the
            // setup operation using the proper extension
            var linksExtra = jQuery(".links-extra");
            linksExtra.ulinksextra();

            // gathers the reference to the body fluid type of layout and then
            // runs the main layout manager extension for the fluid layout
            var fluid = jQuery("body.fluid");
            fluid.ufluid();
        });
