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
    jQuery.fn.uasync = function() {
        // sets the jquery matched object
        var matchedObject = this;

        var _validate = function() {
            var _body = jQuery("body");
            var async = !_body.hasClass("noajax");
            return window.FormData ? async : false;
        };

        var _registerHandlers = function() {
            // retrieves the various elements that are going to be
            // used in the registration for the handlers
            var _body = jQuery("body");
            var links = jQuery("a[href], .link[href]", matchedObject);

            // registers for the click event on the current set of links
            // that exist in the object, so that they can be handled in
            // an async fashion if thats the case
            links.click(function(event) {
                        // in case the control key is pressed the event operation is
                        // not meant to be overriden and should be ignored
                        if (event.metaKey || event.ctrlKey) {
                            return;
                        }

                        // in case the click used the right or center button the
                        // event should be ignored not bean to be overriden
                        if (event.which == 2 || event.which == 3) {
                            return;
                        }

                        // retrieves the current element and the current link
                        // associated so that it can be validated and tested in
                        // the current async environment
                        var element = jQuery(this);
                        var href = element.attr("href");

                        // runs the async link execution with no force flag set
                        // and in case it run through avoids the default link
                        // behavior (avoid duplicated execution)
                        var result = jQuery.uxlinkasync(href, false);
                        result && event.preventDefault();
                    });

            // retrieves the current async registration flag from the body
            // elemennt in case it's currently set returns immediately to
            // avoid duplicated registration
            var async = _body.data("async") || false;
            if (async) {
                return;
            }

            // registers for the data changed event so that if there's new panel
            // data available the layour is update in acordance, so that the async
            // requests are reflected in a layout change
            _body.bind("data", function(event, data, href, uuid, push, hbase) {
                        // in case no unique identifier for the state exists generates a new
                        // on in order to identify the current layout state
                        uuid = uuid || jQuery.uxguid();

                        // retrieves the default hiperlink base value as the target link value
                        // this value may be used to customize the url versus link resolution
                        hbase = hbase || href;

                        // creates the object that describes the current state with both the
                        // unique identifier of the state and the link that generated it
                        var state = {
                            uuid : uuid,
                            href : href
                        };

                        // in case this is not a verified operation the current state
                        // must be pushed into the history stack, so that we're able
                        // to rollback to it latter
                        push && window.history.pushState(state, null, href);

                        try {
                            // replaces the image source references in the requested
                            // data so that no extra images are loaded then loads the
                            // data as the base object structure
                            data = data.replace(/src=/ig, "aux-src=");
                            var base = jQuery(data);

                            // extracts the special body associated data from the data
                            // value escapes it with a special value and then creates
                            // the logical element representation for it
                            var bodyData = data.match(/<body.*>[^]*<\/body>/g)[0];
                            bodyData = bodyData.replace(/aux-src=/ig, "src=");
                            bodyData = bodyData.replace("body", "body_");
                            var body = jQuery(bodyData);

                            // retrieves the information on the current layout state and
                            // on the current base element state, so that options may be
                            // taken on the kind of transforms to apply
                            var _isValid = isBodyValid();
                            var _isBaseValid = isBaseValid(base);

                            // verifies if the current layout and the target layout for
                            // loadinf are valid for layout change in case they're not
                            // raises an exception indicating the problem
                            var isValid = _isValid && _isBaseValid
                            if (!isValid) {
                                throw "Invalid layout or layout not found";
                            }

                            // verifies if the kind of update that is going to be performed
                            // is a full one, meaning that the complete body element is going
                            // to be replace instead of just some of its parts
                            var isFull = type(body) != type();

                            // triggers the pre async event to notify the listening handlers
                            // that the async modification operations are going to be
                            // started and that the dom is going to be modified
                            _body.triggerHandler("pre_async");

                            // hides the current body reference so that all of the update
                            // operations occur with the ui disabled (faster performance)
                            // and the user experience is not broken
                            _body.hide();

                            // runs the proper ajax update on the current contents so that
                            // the page is correctly updated with the new contents, note that
                            // a full update will break the current state of data and inputs
                            if (isFull) {
                                updateFull(base, body);
                            } else {
                                updateSimple(base, body);
                            }

                            // updates the globally unique identifier representation for
                            // the current state in the current structures
                            updateGuid(uuid);

                            // restores the display of the body so that the elements of
                            // it are restored to the user, also scroll the body element
                            // to the top so that the feel is of a new page
                            _body.show();
                            _body.scrollTop(0);

                            // triggers the post async event to notify the listening
                            // handlers about the end of the dom modification operations
                            // so that many operations may be resumed
                            _body.triggerHandler("post_async");
                        } catch (exception) {
                            window.history.back();
                            document.location = href;
                        }
                    });

            // registers for the async envent that should be triggered
            // as a validator for the asyncronous execution of calls, plugins
            // like the form should use this event to validate their
            // own behavior, and react to the result of this event
            _body.bind("async", function() {
                        var _isValid = isBodyValid();
                        return _isValid;
                    });

            // registers for the async start event that marks the
            // the start of a remote asycn call with the intension
            // of chaming the current layout
            _body.bind("async_start", function() {
                        // tries to retrieve the current top loader element, in case it's
                        // not found inserts it in the correct position in the html contents
                        var topLoader = jQuery(".top-loader");
                        if (topLoader.length == 0) {
                            var _html = jQuery("html");
                            var topContainer = jQuery(".top-bar > .container");
                            var topLoader = jQuery("<div class=\"top-loader\">"
                                    + "<div class=\"loader-background\"></div>"
                                    + "</div>");
                            _html.prepend(topLoader);
                        }

                        // sets the top loader to the initial position then shows it in the
                        // the current screen and runs the initial animation in it
                        topLoader.width(0);
                        topLoader.show();
                        topLoader.animate({
                                    width : 60
                                }, 100);
                    });

            // registers for the async end event that marks the end of the remote
            // call that performs an async operation with the intesion of chaging
            // the current layout to remote the current loading structures
            _body.bind("async_end", function() {
                        // runs the final part of the loading animation, moving the loading
                        // bar to the final part of the contents and fading it afterwards
                        var topLoader = jQuery(".top-loader");
                        var parent = topLoader.parent();
                        var width = parent.outerWidth(false);
                        topLoader.animate({
                                    width : width
                                }, 150, function() {
                                    // verifies if the top loader is currently visible if that's
                                    // the case fades it out (ux effect) otherwise hides it immediately
                                    // to avoid problems with the fading effect
                                    var isVisible = topLoader.is(":visible");
                                    if (isVisible) {
                                        topLoader.fadeOut(150);
                                    } else {
                                        topLoader.hide();
                                    }
                                });
                    });

            // registers for the location changed event in order to validate the
            // location changes for async execution then sets the async flag in the
            // current body in order duplicated registration
            _body.bind("location", function(event, location) {
                        // tries to runthe async link logic and in case it goes through
                        // cancels the current event returning an invalid value, so that
                        // the default location setting logic does not run
                        var result = jQuery.uxlinkasync(location, false);
                        return !result;
                    });
            _body.data("async", true);
        };

        var _setPopHandler = function() {
            // in case the pop state (changed) handler is already set there's
            // no need to set it again and so returns immediately
            if (window.onpopstate != null) {
                return;
            }

            // sets the initial and loded variables so that they will
            // be used by the pop state function handler as a clojure
            var initial = null;

            // registers the pop state changed handler function so that
            // it's possible to restore the state using an async approach
            window.onpopstate = function(event) {
                // verifies if the current state is valid by checking the current
                // document url agains the link defined in the state in case it's
                // the same or no state exists it's considered valid
                var isValid = event.state == null
                        || event.state.href == document.URL;

                // retrieves the proper uuid value to be used in the trigger
                // of the link action, taking into account the current state
                var uuid = event.state ? event.state.uuid : null;

                // in case the event raised contains no state (not pushed)
                // and the location or the location is the initial one the
                // async login must be run
                if (event.state != null || document.location == initial) {
                    var href = document.location;
                    isValid && jQuery.uxlinkasync(href, true, uuid);
                }

                // in case the initial location value is not set this is the
                // the right time to set it
                if (initial == null) {
                    initial = document.location;
                }
            };
        };

        // validates if the current system has support for the async
        // behavior in case it does not returns immediately avoiding
        // any async behavior to be applied, but first it unsets the
        // async flag in the current body to avoid async behavior
        var result = _validate();
        if (!result) {
            var _body = jQuery("body");
            _body.data("async", false);
            return;
        }

        // runs the initial registration logic enabling the current matched
        // object with the async logic and execution
        _registerHandlers();
        _setPopHandler();
    };

    var isStatic = function(body) {
        var body = body || jQuery("body");
        return body.hasClass("static");
    };

    var isFluid = function(body) {
        var body = body || jQuery("body");
        return body.hasClass("fluid");
    };

    var type = function(body) {
        if (isStatic(body)) {
            return "static";
        }
        if (isFluid(body)) {
            return "fluid";
        }
        return null;
    };

    var isBodyValid = function() {
        var hasContent = jQuery(".content").length > 0;
        if (!hasContent) {
            return false;
        }

        return true;
    };

    var isBaseValid = function(base) {
        var hasContent = base.filter(".content");
        if (!hasContent) {
            return false;
        }

        return true;
    };

    var updateGuid = function(uuid) {
        var _body = jQuery("body");
        _body.attr("uuid", uuid);
    };

    var updateFull = function(base, body) {
        updateBody(body);
        updateBodyFull(body);
    };

    var updateSimple = function(base, body) {
        updateBody(body);
        updateLinks(base);
        updateSideLinks(base);
        updateHeader(base);
        updateContent(base);
        fixFluid();
    };

    var updateBody = function(body) {
        var _body = jQuery("body");
        var bodyClass = body.attr("class");
        _body.attr("class", bodyClass);
    };

    var updateBodyFull = function(body) {
        var _body = jQuery("body");
        var bodyHtml = body.html();
        bodyHtml = bodyHtml.replace(/aux-src=/ig, "src=");
        _body.html(bodyHtml);
        _body.show();
        _body.uxapply();
        _body.hide();
    };

    var updateLinks = function(base) {
        var links = jQuery(".links", base);
        var links_ = jQuery(".links");
        var linksClass = links.attr("class")
        var linksHtml = links.html();
        linksHtml = linksHtml && linksHtml.replace(/aux-src=/ig, "src=");
        links_.html(linksHtml);
        links_.attr("class", linksClass);
        links_.uxapply();
    };

    var updateSideLinks = function(base) {
        var sideLinks = jQuery(".side-links", base);
        var sideLinks_ = jQuery(".side-links");
        var sideLinksClass = sideLinks.attr("class")
        var sideLinksHtml = sideLinks.html();
        sideLinksHtml = sideLinksHtml
                && sideLinksHtml.replace(/aux-src=/ig, "src=");
        sideLinks_.html(sideLinksHtml);
        sideLinks_.attr("class", sideLinksClass);
        sideLinks_.uxapply();
    };

    var updateHeader = function(base) {
        var header = base.filter(".header");
        var header_ = jQuery(".header");
        var container = jQuery(".header-container", header);
        var container_ = jQuery(".header-container", header_);
        var title = jQuery("> h1", header);
        var title_ = jQuery("> h1", header_);
        var containertHtml = container.html();
        containertHtml = containertHtml
                && containertHtml.replace(/aux-src=/ig, "src=");
        container_.html(containertHtml);
        container_.uxapply();
        var titleHtml = title.html();
        titleHtml = titleHtml && titleHtml.replace(/aux-src=/ig, "src=");
        title_.html(titleHtml);
        title_.uxapply();
    };

    var updateContent = function(base) {
        var content = base.filter(".content");
        var content_ = jQuery(".content");
        var contentClass = content.attr("class");
        var contentHtml = content.html();
        contentHtml = contentHtml.replace(/aux-src=/ig, "src=");
        content_.html(contentHtml);
        content_.attr("class", contentClass);
        content_.uxapply();
        content_.uxshortcuts();
    };

    var fixFluid = function() {
        var _body = jQuery("body");
        var isFluid = _body.hasClass("fluid");
        if (!isFluid) {
            return;
        }

        var content = jQuery(".content");
        var contentContainer = jQuery(".content-container", content);
        contentContainer.addClass("border-box");
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
            var elements = jQuery(".header, .content, .footer", matchedObject);
            var sideLinks = jQuery(".side-links", matchedObject);
            var contentContainer = jQuery(".content-container", matchedObject);

            // wrapps the complete set of valid elements of the current layout
            // arround the container element, as this will provide extra flexibility
            // for the dynamic dimensions of this layout
            elements.wrapAll("<div class=\"container\"></div>");

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
            // in case no elements have been matched, must return
            // immediately to avoid any side effect or problem
            if (matchedObject.length == 0) {
                return;
            }

            // retrieves the reference to the element
            // to be used in the construction of the
            // extra links menu (the links more element)
            var links = matchedObject.parents(".links");
            var linkMore = jQuery(".link-more", links);
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

            // runs the initial update of the position for the currently
            // matched object so that the panel is properly displayed in
            // the viewport once it's shown on screen
            _updatePosition(matchedObject, options);
        };

        /**
         * Registers the event handlers for the created objects.
         */
        var _registerHandlers = function() {
            // in case no elements have been matched, must return
            // immediately to avoid any side effect or problem
            if (matchedObject.length == 0) {
                return;
            }

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

                        _updatePosition(linksExtra, options);

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

        var _updatePosition = function(matchedObject, options) {
            // verifies if the matched object already contains a defined
            // margin left in the element, and for such cases returns the
            // control flow immediately to the caller method
            var positioned = matchedObject.hasClass("positioned");
            if (positioned) {
                return;
            }

            // retrieves the various elements that are going to be
            // used in the update of the current element's position
            var links = matchedObject.parents(".links");
            var linkMore = jQuery(".link-more", links);

            // retrieves both the width of the extra links menu
            // and the width of the more link element then calculates
            // the extra width to be deduces using margin and applies
            // the value to the matched object (menu alignment)
            var width = matchedObject.outerWidth(true);
            var linkMoreWidth = linkMore.outerWidth(true);
            var isValid = width != 0 && linkMoreWidth != 0;
            var extraWidth = (width - linkMoreWidth) * -1;
            isValid && matchedObject.css("margin-left", extraWidth + "px");
            isValid && matchedObject.addClass("positioned");
        };

        // initializes the plugin
        initialize();

        // returns the object
        return this;
    };
})(jQuery);

(function(jQuery) {
    jQuery.fn.lapply = function(options) {
        // sets the jquery matched object
        var matchedObject = this;

        // starts the asynchronous extension so that the proper mechanisms
        // are set in place to provide a simple and fluid environment for
        // the layout infra-sructure that is going to be loaded
        matchedObject.uasync();

        // gathers the reference to the body fluid type of layout and then
        // runs the main layout manager extension for the fluid layout
        var fluid = matchedObject.filter("body.fluid");
        fluid.ufluid();

        // retrieves the reference to the links extra element and runs the
        // setup operation using the proper extension
        var linksExtra = jQuery(".links-extra", matchedObject);
        linksExtra.ulinksextra();
    };
})(jQuery);

jQuery(document).ready(function() {
            // retrieves the reference to the top level
            // body element to apply the components in it
            var _body = jQuery("body");

            // applies the ui component to the body element (main
            // element) and then applies the extra component logic
            // from the composite extensions
            _body.lapply();

            // registers for the applied event on the body to be
            // notified of new apply operations and react to them
            // in the sense of applying the specifics
            _body.bind("applied", function(event, base) {
                        base.lapply();
                    });
        });
