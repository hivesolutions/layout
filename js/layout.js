// Hive Layout Framework
// Copyright (c) 2008-2017 Hive Solutions Lda.
//
// This file is part of Hive Layout Framework.
//
// Hive Layout Framework is free software: you can redistribute it and/or modify
// it under the terms of the Apache License as published by the Apache
// Foundation, either version 2.0 of the License, or (at your option) any
// later version.
//
// Hive Layout Framework is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// Apache License for more details.
//
// You should have received a copy of the Apache License along with
// Hive Layout Framework. If not, see <http://www.apache.org/licenses/>.

// __author__    = João Magalhães <joamag@hive.pt>
// __version__   = 1.0.0
// __revision__  = $LastChangedRevision$
// __date__      = $LastChangedDate$
// __copyright__ = Copyright (c) 2008-2017 Hive Solutions Lda.
// __license__   = Apache License, Version 2.0

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
            links = links.filter(":not(.link-confirm)");

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
                // event should be ignored not meant to be overriden
                if (event.which === 2 || event.which === 3) {
                    return;
                }

                // retrieves the current element and the current link
                // associated so that it can be validated and tested in
                // the current async environment
                var element = jQuery(this);
                var href = element.attr("href");

                // verifies if the link element contains the flag class
                // that prevent the typical async behavior, if that's the
                // case the current method returns immediately
                var noAsync = element.hasClass("no-async");
                if (noAsync) {
                    return;
                }

                // tries to retrieve the value of the target attribute an
                // in case the value of it is not self (current frame) then
                // avoid handling as an aysnc link (browser handling)
                var target = element.attr("target");
                if (target && target !== "_self") {
                    return;
                }

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
            // data available the layour is updated in acordance, so that the async
            // requests are reflected in a layout change
            _body.bind("data", function(event, data, href, uuid, push, hbase) {
                // in case no unique identifier for the state exists generates a new
                // one in order to identify the current layout state
                uuid = uuid || jQuery.uxguid();

                // retrieves the default hiperlink base value as the target link value
                // this value may be used to customize the url versus link resolution
                hbase = hbase || href;

                // constructs the absolute path from the possibly absolute href
                // value, so that it may be used for some of the operations
                var relative = href.replace(/^(?:\/\/|[^\/]+)*\//, "/");

                // creates the object that describes the current state with both the
                // unique identifier of the state and the link that generated it
                var state = {
                    uuid: uuid,
                    href: href
                };

                try {
                    // replaces the image source references in the requested
                    // data so that no extra images are loaded then loads the
                    // data as the base object structure
                    data = data.replace(/src=/ig, "aux-src=");
                    var base = jQuery(data);

                    // extracts the special body associated data from the data
                    // value escapes it with a special value and then creates
                    // the logical element representation for it
                    var bodyData = data.match(/<body[^\0]*>[^\0]*<\/body>/ig)[0];
                    bodyData = bodyData.replace("body", "body_");
                    var body = jQuery(bodyData);

                    // retrieves the information on the current layout state and
                    // on the current base element state, so that options may be
                    // taken on the kind of transforms to apply
                    var _isValid = isBodyValid();
                    var _isContentsValid = isContentsValid(body);
                    var _isBaseValid = isBaseValid(base);

                    // verifies if the current layout and the target layout for
                    // loadinf are valid for layout change in case they're not
                    // raises an exception indicating the problem
                    var isValid = _isValid && _isContentsValid && _isBaseValid;
                    if (!isValid) {
                        throw "Invalid layout or layout not found";
                    }

                    // verifies if the kind of update that is going to be performed
                    // is a full one, meaning that the complete body element is going
                    // to be replace instead of just some of its parts
                    var isFull = type(body) !== type();
                    isFull = isFull || hash(body) !== hash();

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

                    // triggers do async event, responsible for the possible changing
                    // of the body of the current document by any external operation
                    // binding to the current execution logic (allows extension)
                    _body.triggerHandler("do_async", [base, body]);

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

                    // in case this is not a verified operation the current state
                    // must be pushed into the history stack, so that we're able
                    // to rollback to it latter, note that in case the google
                    // analytics reference exists a new event is triggered, the
                    // same is also performed for conversion tracking
                    push && window.history.pushState(state, null, href);
                    push && window._gaq && _gaq.push(["_trackPageview", relative]);
                    push && window.ga && ga("send", {
                        hitType: "pageview",
                        page: relative
                    });
                    push && window.google_trackConversion && trackConversion();
                } catch (exception) {
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
                // tries to retrieve the reference to the current bar based loader
                // animation element and in case it does not exists adds a new one
                // to the current structure so that it may be used
                var barLoader = jQuery(".bar-loader");
                if (barLoader.length === 0) {
                    barLoader = jQuery("<div class=\"bar-loader\"></div>");
                    _body.prepend(barLoader);
                }

                // tries to retrieve the current top loader element, in case it's
                // not found inserts it in the correct position in the body contents
                var topLoader = jQuery(".top-loader");
                if (topLoader.length === 0) {
                    topLoader = jQuery("<div class=\"top-loader\">" +
                        "<div class=\"loader-background\"></div>" + "</div>");
                    _body.prepend(topLoader);
                }

                // adds the loading class to both of the "loader" so that their layut
                // may be "modified" taking that into account
                barLoader.addClass("loading");
                topLoader.addClass("loading");

                // verifies if the top loader is defined as visible (valid opacity) and
                // in case it's not return immediately, avoiding the display of it
                var isVisible = topLoader.css("opacity") === "1";
                if (!isVisible) {
                    return;
                }

                // sets the top loader to the initial position then shows it in the
                // the current screen and runs the initial animation in it
                topLoader.width(0);
                topLoader.show();
                topLoader.animate({
                    width: 60
                }, 100);
            });

            // registers for the async end event that marks the end of the remote
            // call that performs an async operation with the intesion of chaging
            // the current layout to remote the current loading structures
            _body.bind("async_end", function() {
                // runs the final part of the loading animation, removing the loading
                // marking class from both loaders avoiding any further layout notification
                var barLoader = jQuery(".bar-loader");
                var topLoader = jQuery(".top-loader");
                setTimeout(function() {
                    barLoader.removeClass("loading");
                    topLoader.removeClass("loading");
                }, 350);

                // verifies if the top loader is defined as visible (valid opacity) and
                // in case it's not return immediately, avoiding the display of it
                var isVisible = topLoader.css("opacity") === "1";
                if (!isVisible) {
                    return;
                }

                // retrieves the parent element of the top loader and uses it to retrieve
                // the target width for the loading bar animation
                var parent = topLoader.parent();
                var width = parent.outerWidth(false);

                // performs the proper animation of the top loader moving it's width along
                // the horizontal line, providing the "feeling of progress"
                topLoader.animate({
                    width: width
                }, 350, function() {
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
                // tries to run the async link logic and in case it goes through
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
            if (window.onpopstate !== null) {
                return;
            }

            // while setting the pop handler for the first time, the first and
            // initial state must be populated with the current identifier and
            // the reference to the initial state, this is required to provide
            // compatability with the current invalid state support
            var href = document.location.href;
            var state = {
                uuid: jQuery.uxguid(),
                href: href
            };
            window.history.replaceState(state, null, href);
            updateGuid(state.uuid);

            // registers the pop state changed handler function so that
            // it's possible to restore the state using an async approach
            window.onpopstate = function(event) {
                // retrieves the reference to the top level body element
                // that is going to be used for global operations
                var _body = jQuery("body");

                // retrieves the proper uuid value to be used in the trigger
                // of the link action, taking into account the current state
                var uuid = event.state ? event.state.uuid : null;

                // verifies if the uuid of the event in the pop is the same
                // as the one currently defined in the body, if that's the case
                // the async operation should be ignored
                if (uuid && uuid === _body.attr("uuid")) {
                    return;
                }

                // in case the state of the event is invalid the value of the event
                // is ignored and the current state is properly updated so that
                // the value becomes ready and available (just as a safety measure)
                if (event.state === null) {
                    href = document.location.href;
                    var state = {
                        uuid: jQuery.uxguid(),
                        href: href
                    };
                    window.history.replaceState(state, null, href);
                    updateGuid(state.uuid);
                    return;
                }

                // retrieves the location of the current document and uses it
                // to run the async redirection logic already used by the link
                // async infra-structure for the link click operations
                href = document.location.href;
                jQuery.uxlinkasync(href, true, uuid);
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
        // object with the async logic and execution, note that the pop handler
        // has a delayed registration to avoid some problems with the initiaç
        // pop of state generated by some browsers (avoids bug)
        _registerHandlers();
        setTimeout(_setPopHandler);
    };

    var isStatic = function(body) {
        body = body || jQuery("body");
        return body.hasClass("static");
    };

    var isFluid = function(body) {
        body = body || jQuery("body");
        return body.hasClass("fluid");
    };

    var isSimple = function(body) {
        body = body || jQuery("body");
        return body.hasClass("simple");
    };

    var type = function(body) {
        if (isStatic(body)) {
            return "static";
        }
        if (isFluid(body)) {
            return "fluid";
        }
        if (isSimple(body)) {
            return "simple";
        }
        return "static";
    };

    var hash = function(body) {
        var buffer = "";
        body = body || jQuery("body");
        buffer += body.hasClass("static") ? "1" : "0";
        buffer += body.hasClass("fluid") ? "1" : "0";
        buffer += jQuery("#header", body).length ? "1" : "0";
        buffer += jQuery("#content", body).length ? "1" : "0";
        buffer += jQuery("#footer", body).length ? "1" : "0";
        buffer += jQuery("#windows", body).length ? "1" : "0";
        buffer += jQuery(".action-bar", body).length ? "1" : "0";
        return buffer;
    };

    var isBodyValid = function() {
        var hasContent = jQuery("#content").length > 0;
        if (!hasContent) {
            return false;
        }

        return true;
    };

    var isContentsValid = function(body) {
        var _body = jQuery("body");
        var isFramework = body.hasClass("ux");
        if (!isFramework) {
            return false;
        }

        var identifier = body.attr("data-id");
        var identifier_ = _body.attr("data-id");
        var isCompatible = identifier === identifier_;
        if (!isCompatible) {
            return false;
        }

        return true;
    };

    var isBaseValid = function(base) {
        var hasContent = base.filter("#content");
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
        updateTitle(base);
        updateIcon(base);
        updateMeta(base);
    };

    var updateSimple = function(base, body) {
        updateBody(body);
        updateTitle(base);
        updateIcon(base);
        updateLinks(base);
        updateSideLinks(base);
        updateActionBar(base);
        updateTopMenu(base);
        updateNotifications(base);
        updateWindows(base);
        updateHeader(base);
        updateContent(base);
        updateFooter(base);
        updateMeta(base);
        fixFluid();
    };

    var updateBody = function(body) {
        var _body = jQuery("body");
        var bodyClass = body.attr("class");
        var bodyStyle = body.attr("style") || "";
        var isVisible = body.is(":visible");
        bodyStyle += isVisible ? "" : "display:none;";
        _body.attr("class", bodyClass);
        _body.attr("style", bodyStyle);
        _body.uxbrowser();
        _body.uxfeature();
        _body.uxmobile();
        _body.uxresponsive();
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

    var updateTitle = function(base) {
        var title = base.filter("title");
        var title_ = jQuery("title");
        var titleHtml = title.html();
        title_.html(titleHtml);
    };

    var updateIcon = function(base) {
        var icon = base.filter("link[rel='shortcut icon']");
        var icon_ = jQuery("link[rel='shortcut icon']");
        var iconHref = icon.attr("href");
        icon_.attr("href", iconHref);
    };

    var updateMeta = function(base) {
        var meta = base.filter(".meta");
        var meta_ = jQuery(".meta");
        var metaHtml = meta.html();
        meta_.html(metaHtml);
        meta_.uxapply();
    };

    var updateLinks = function(base) {
        var links = jQuery("> .links", base);
        var links_ = jQuery("#header > .links");
        var header = jQuery("#header");
        links_.remove();
        header.append(links);
        links_ = jQuery("#header > .links");
        links_.uxapply();
    };

    var updateSideLinks = function(base) {
        var sideLinks = jQuery("> .side-links", base);
        var sideLinks_ = jQuery("#header > .side-links");
        var sideLinksClass = sideLinks.attr("class");
        var sideLinksHtml = sideLinks.html();
        sideLinksHtml = sideLinksHtml && sideLinksHtml.replace(/aux-src=/ig, "src=");
        sideLinks_.html(sideLinksHtml);
        sideLinks_.attr("class", sideLinksClass);
        sideLinks_.uxapply();
    };

    var updateActionBar = function(base) {
        var actionBar = jQuery(".action-bar", base);
        var actionBar_ = jQuery(".action-bar");
        var actionBarClass = actionBar.attr("class");
        var actionBarHtml = actionBar.html();
        actionBarHtml = actionBarHtml && actionBarHtml.replace(/aux-src=/ig, "src=");
        actionBar_.html(actionBarHtml);
        actionBar_.attr("class", actionBarClass);
        actionBar_.uxapply();
    };

    var updateTopMenu = function(base) {
        var topBar = jQuery(".top-bar");
        var menu = jQuery(".menu", topBar);
        menu.triggerHandler("hide");
    };

    var updateNotifications = function(base) {
        var notifications = base.filter(".header-notifications-container");
        var notifications_ = jQuery(".header-notifications-container");
        var notificationsHtml = notifications.html();
        notifications_.html(notificationsHtml);
    };

    var updateWindows = function(base) {
        var windows = base.filter("#windows");
        var windows_ = jQuery("#windows");
        var windowsClass = windows.attr("class");
        var windowsHtml = windows.html();
        windowsHtml = windowsHtml && windowsHtml.replace(/aux-src=/ig, "src=");
        windows_.html(windowsHtml);
        windows_.attr("class", windowsClass);
        windows_.uxapply();
    };

    var updateHeader = function(base) {
        var header_ = jQuery("#header");
        var isFull = header_.hasClass("replace");
        isFull ? updateHeaderFull(base) : updateHeaderSimple(base);
    };

    var updateHeaderSimple = function(base) {
        var header = base.filter("#header");
        var header_ = jQuery("#header");
        var container = jQuery(".header-container", header);
        var container_ = jQuery(".header-container", header_);
        var title = jQuery("> h1", header);
        var title_ = jQuery("> h1", header_);
        var containertHtml = container.html();
        containertHtml = containertHtml && containertHtml.replace(/aux-src=/ig, "src=");
        container_.html(containertHtml);
        container_.uxapply();
        var titleHtml = title.html();
        titleHtml = titleHtml && titleHtml.replace(/aux-src=/ig, "src=");
        title_.html(titleHtml);
        title_.uxapply();
    };

    var updateHeaderFull = function(base) {
        var header = base.filter("#header");
        var header_ = jQuery("#header");
        var headerClass = header.attr("class");
        var headerHtml = header.html();
        headerHtml = headerHtml && headerHtml.replace(/aux-src=/ig, "src=");
        header_.html(headerHtml);
        header_.attr("class", headerClass);
        header_.uxapply();
    };

    var updateContent = function(base) {
        var content = base.filter("#content");
        var content_ = jQuery("#content");
        var contentClass = content.attr("class");
        var contentHtml = content.html();
        var isShortcuts = content.hasClass("shortcuts");
        contentHtml = contentHtml.replace(/aux-src=/ig, "src=");
        content_.html(contentHtml);
        content_.attr("class", contentClass);
        content_.uxapply();
        isShortcuts && content_.uxshortcuts();
    };

    var updateFooter = function(base) {
        var footer = base.filter("#footer");
        var footer_ = jQuery("#footer");
        var footerClass = footer.attr("class");
        var footerHtml = footer.html();
        footerHtml = footerHtml && footerHtml.replace(/aux-src=/ig, "src=");
        footer_.html(footerHtml);
        footer_.attr("class", footerClass);
        footer_.uxapply();
    };

    var fixFluid = function() {
        var _body = jQuery("body");
        var isFluid = _body.hasClass("fluid");
        if (!isFluid) {
            return;
        }

        var content = jQuery("#content");
        var contentContainer = jQuery(".content-container", content);
        contentContainer.addClass("border-box");
    };

    var trackConversion = function() {
        var meta = jQuery(".meta");
        var conversionId = jQuery("[name=adwords-conversion-id]", meta);
        var itemId = jQuery("[name=adwords-dynx-itemid]", meta);
        var totalValue = jQuery("[name=adwords-dynx-totalvalue]", meta);
        var pageType = jQuery("[name=adwords-dynx-pagetype]", meta);
        if (!window.google_trackConversion) {
            return;
        }
        if (!conversionId || conversionId.length === 0) {
            return;
        }
        conversionId = parseInt(conversionId.attr("content"));
        if (!conversionId) {
            return;
        }
        totalValue = parseFloat(totalValue.attr("content"));
        pageType = pageType.attr("content");
        var itemIdList = [];
        itemId.each(function(index, element) {
            var _element = jQuery(this);
            var elementId = _element.text();
            itemIdList.push(elementId);
        });
        google_trackConversion({
            google_conversion_id: conversionId,
            google_custom_params: {
                dynx_itemid: itemIdList,
                dynx_totalvalue: totalValue,
                dynx_pagetype: pageType
            },
            google_remarketing_only: true
        });
    };
})(jQuery);

(function(jQuery) {
    jQuery.fn.ufluid = function(options) {
        // the default values for the fluid element
        var defaults = {};

        // sets the default options value and then
        // runs the proper extension/construction
        options = options ? options : {};
        options = jQuery.extend(defaults, options);

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
            if (matchedObject.length === 0) {
                return;
            }

            // retrieves the refereces to the various inner elements
            // of the fluid layout that are going to be updated
            var elements = jQuery("#header, #content, #footer, #windows",
                matchedObject);
            var sideLinks = jQuery(".side-links", matchedObject);
            var contentContainer = jQuery(".content-container", matchedObject);

            // wrapps the complete set of valid elements of the current layout
            // arround the container element, as this will provide extra flexibility
            // for the dynamic dimensions of this layout
            elements.wrapAll("<div class=\"container\"></div>");

            // runs the initial laout operation so that the current
            // panel is display with the correct dimensions
            _layout(matchedObject, options, true);

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
            if (matchedObject.length === 0) {
                return;
            }

            // retrieves the reference to the various elements that
            // are going to be used for event handler registration
            var content = jQuery(".container > .content", matchedObject);
            var topBar = jQuery(".top-bar", matchedObject);
            var sideLinks = jQuery(".side-links", matchedObject);
            var logoLink = jQuery(".logo > a", topBar);
            var dropField = jQuery(".drop-field", topBar);

            // registers for the pre async event to be able to run
            // some initial operation on the current viewport
            matchedObject.bind("pre_async", function() {
                var element = jQuery(this);
                var isMobile = element.hasClass("mobile-s");
                isMobile && sideLinks.triggerHandler("hide");
            });

            // registers for the post async event to be able
            // to sync the menu state for non mobile devices
            matchedObject.bind("post_async", function() {
                var element = jQuery(this);
                var isMobile = element.hasClass("mobile-s");
                !isMobile && _layout(matchedObject, options, true);
            });

            // registers for the click event on the top level (body)
            // element to (if required) hide the side links
            matchedObject.click(function() {
                var element = jQuery(this);
                var sideVisible = element.hasClass("side-visible");
                var isMobile = element.hasClass("mobile-s");
                if (!sideVisible || !isMobile) {
                    return;
                }
                sideLinks.triggerHandler("hide");
            });

            // registers for the click event on the top bar to avoid
            // propagation of it to the top layers (avoids hiding)
            topBar.click(function(event) {
                event.stopPropagation();
                event.stopImmediatePropagation();
            });

            // registers for the click event on the side links to avoid
            // propagation of it to the top layers (avoids hiding)
            sideLinks.click(function(event) {
                event.stopPropagation();
                event.stopImmediatePropagation();
            });

            // registers for the click event on the logo link element
            // so that the side links visibility is changed
            logoLink.click(function() {
                sideLinks.triggerHandler("toggle");
            });

            // registers for the toggle event in the side links so that
            // their visibility is changed according to the current state
            sideLinks.bind("toggle", function() {
                var element = jQuery(this);
                var isVisible = element.is(":visible");
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
                var isVisible = element.is(":visible");
                if (isVisible) {
                    return;
                }
                element.show();
                var duration = _isFixed() ? 0 : 350;
                element.animate({
                    left: 0
                }, {
                    duration: duration,
                    easing: "swing",
                    complete: function() {
                        _layout(matchedObject, options, true);
                    },
                    progress: function() {
                        _layout(matchedObject, options, false);
                    }
                });
            });

            // registers for the hide event so that the side links
            // are properly hidden from the current display container
            sideLinks.bind("hide", function() {
                var element = jQuery(this);
                var isVisible = element.is(":visible");
                if (!isVisible) {
                    return;
                }
                var width = element.outerWidth(true);
                var duration = _isFixed() ? 0 : 350;
                element.animate({
                    left: width * -1
                }, {
                    duration: duration,
                    easing: "swing",
                    complete: function() {
                        element.hide();
                        _layout(matchedObject, options, true);
                    },
                    progress: function() {
                        _layout(matchedObject, options, false);
                    }
                });
            });

            // registers for the selection of an element in the top
            // drop field and resets the drop field for such operation
            // as this is considered the expected behaviour
            dropField.bind("value_select", function() {
                var element = jQuery(this);
                element.uxreset();
                element.blur();
            });
        };

        var _layout = function(element, options, complete) {
            // retrieves the reference to the various elements that are going
            // to have their layout update, or that are going to be used as
            // reference for the various layout calculus operations
            var _body = jQuery("body");
            var content = jQuery("#content", matchedObject);
            var sideLinks = jQuery(".side-links", matchedObject);

            // calculates the proper side links width, taking into account
            // the complete set of possibilities for it's visibility, like
            // the current left position and the visibility of it
            var sideLinksVisible = sideLinks.is(":visible");
            var sideLinksWidth = sideLinks.outerWidth(true);
            var sideLinksLeft = sideLinks.css("left");
            var sideLinksDisplay = sideLinks.css("display");
            sideLinksLeft = parseInt(sideLinksLeft);
            sideLinksLeft = sideLinksLeft ? sideLinksLeft : 0;
            sideLinksWidth += sideLinksLeft;
            sideLinksWidth = sideLinksVisible ? sideLinksWidth : 0;

            // updates the margin left property of the content panel
            // with the proper width of the side links so that no overlap
            // exists between both panels (as expected)
            content.css("margin-left", sideLinksWidth + "px");

            // verifies if this is considered to be a complete layout update
            // in case it's not returns immediately (nothing remaining to be done)
            if (!complete) {
                return;
            }

            // updates the side links values, effectively persisting them
            // in the style section of the element (propagating it from the
            // class based css and avoiding possible device issues)
            sideLinks.css("display", sideLinksDisplay);
            sideLinks.css("left", sideLinksLeft);

            // updates the global body class according to the visibility
            // of the side links (allows global css selection)
            if (sideLinksVisible) {
                _body.addClass("side-visible");
            } else {
                _body.removeClass("side-visible");
            }
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
        // the default values for the links extra
        var defaults = {};

        // sets the default options value and then
        // runs the proper extension/construction
        options = options ? options : {};
        options = jQuery.extend(defaults, options);

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
            if (matchedObject.length === 0) {
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
            if (extraSize === 0) {
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
            if (activeLink.length !== 0) {
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
            if (matchedObject.length === 0) {
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
            var isValid = width !== 0 && linkMoreWidth !== 0;
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
    jQuery.fn.ubulk = function(options) {
        // the default values for the bulk element
        var defaults = {};

        // sets the default options value and then
        // runs the proper extension/construction
        options = options ? options : {};
        options = jQuery.extend(defaults, options);

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
            // retrieves the reference to the various element that are
            // going to be used in the complete element modification
            // operations, that should make the operation links ready
            // to be used with a proper confirmation message
            var content = matchedObject.parents(".content");
            var operations = jQuery(".drop-down.operations", content);
            var operationsLinks = jQuery("> li > a", operations);
            operationsLinks.addClass("no-async");

            // iterates over the complete set of selected table elements
            // to start them in their concrete initialization values
            matchedObject.each(function(index, element) {
                // retrieves the reference to the current element
                // (bulk) in iteration and it's child element
                var _element = jQuery(this);
                var tableBody = jQuery("tbody", matchedObject);
                var size = _element.attr("data-size");
                var total = _element.attr("data-total");
                var templateAll = _element.attr("data-all");
                var templateSelect = _element.attr("data-select");
                var templateDeselect = _element.attr("data-deselect");

                // creates the table all (special) row at the begining
                // of the bulk table and then retrieves the reference
                // to it to be able to change it
                tableBody.prepend("<tr class=\"table-all\"></tr>");
                var tableAll = jQuery(".table-all", tableBody);

                // creates the proper template information taking into
                // account possible override via attribute
                templateAll = templateAll || "All %s items on this page are selected.";
                templateSelect = templateSelect || "Select all %s items";
                templateDeselect = templateDeselect || "Clear all";

                // runs the format operation for each of the templates
                // with the proper (initial) arguments
                var messageAll = templateAll.formatC(size);
                var messageSelect = templateSelect.formatC(total);
                var messageDeselect = templateDeselect;

                // adds the (unique) table column to the all rows that
                // contain the proper all message and selectors and
                // the runs the initial update state for the bulk
                tableAll.append("<td colspan=\"99\">" + "<span class=\"message\">" + messageAll +
                    "</span>" + "<a class=\"selector\">" + messageSelect + "</a>" +
                    "<a class=\"deselector\">" + messageDeselect + "</a>" + "</td>");
                _updateState(_element, options);
            });
        };

        /**
         * Registers the event handlers for the created objects.
         */
        var _registerHandlers = function() {
            // retrieves the reference to the various element that are
            // going to be used in the complete event handling registration
            var _body = jQuery("body");
            var container = matchedObject.parents(".container");
            var content = matchedObject.parents(".content");
            var operationsWindows = jQuery(".window.window-operation",
                container);
            var operations = jQuery(".drop-down.operations", content);
            var operationsLinks = jQuery("> li > a", operations);
            var operationsForms = jQuery("> form", operationsWindows);

            // retrieves the references to the header checkbox and the various
            // possible checkboxes from the body of the current table
            var headerCheckbox = jQuery("thead input[type=checkbox]",
                matchedObject);
            var bodyCheckboxes = jQuery("tbody input[type=checkbox]",
                matchedObject);

            // retreives the reference to the table all information
            // message and to its child selector
            var tableAll = jQuery("tbody .table-all", matchedObject);
            var tableAllSelector = jQuery(".selector", tableAll);
            var tableAllDeselector = jQuery(".deselector", tableAll);

            // registers for the click operation in the operations links
            // drop down so that the proper link may be changed according
            // to the selected lines of the bulk operation panel
            operationsLinks.click(function(event) {
                // retrieves the current element in iteration and uses it
                // to gather the reference to the associated bulk element
                // and the complete set of active table rows in it
                var element = jQuery(this);
                var content = element.parents(".content");
                var bulk = jQuery(".bulk", content);
                var activeRows = jQuery(".table-row.active", bulk);

                // tries to determine if the link referes a window opening
                // situation and if that's the case returns immediately as
                // the final handling will be performed by the window
                var window = element.attr("data-window_open");
                if (window) {
                    return;
                }

                // determines if the current bulk panel is selected under
                // the verything mode, if that's the case the operation is
                // going to be performed for the complete set of elements
                var isEverything = bulk.hasClass("everything");

                // retrieves the total number of records/items associated
                // with the bulk operation and then in case the everything
                // mode is selected forces the count as that value, otherwise
                // uses the currently slected active rows
                var total = bulk.attr("data-total");
                var count = isEverything ? total : activeRows.length;

                // tries to retrieve the message defined for the bulk
                // element, defaulting to the base one in case one is
                // not provided for the bulk structure
                var template = bulk.attr("data-message");
                template = template || "Are you sure you want to perform ['%s'] ?\\n" +
                    "The operation is going to be performed for [%s entities].";
                var message = template.formatC(element.text(), count);

                // starts the ids value string to the default (empty)
                // value and then iterates over the various active rows
                // to appends the id values of each to the string
                var ids = "";
                activeRows.each(function(index, element) {
                    var _element = jQuery(this);
                    ids += _element.attr("data-id") + ",";
                });

                // in case the everything mode is active the gathered
                // ids are ignored as the selection is going to be
                // performed on the server side
                ids = isEverything ? "" : ids;

                // retrieves the current (base) link value for the
                // element and adds the ids value to it making the
                // complete link value (with identifiers)
                var link = element.attr("href");
                var hasGet = link.indexOf("?") !== -1;
                var separator = hasGet ? "&" : "?";
                var completeLink = link + separator;
                completeLink += ids ? "ids=" + ids : "";

                // calls the confirm window in the document, so that
                // only in case the operation is confirmed the proper
                // redirection is performed (as expected)
                _body.uxconfirm(message, function(result) {
                    // in case the result is cancel avoids the current
                    // execution and returns immediately
                    if (result === false) {
                        return;
                    }

                    // updates the link value in the element and runs
                    // the location plugin to change the browser location
                    element.attr("href", completeLink);
                    jQuery.uxlocation(completeLink);
                });

                // prevents the default event so that tha proper link
                // click operation is not going to be performed
                event.preventDefault();
            });

            // registers for the pre submit event on the operations forms so
            // that it's possible to change the action value for the selected
            // values (changes the ids value on the fly)
            operationsForms.bind("pre_submit", function() {
                // retrieves the reference to the current element and
                // then uses it to retrieve the parent bulk values
                var element = jQuery(this);
                var container = element.parents(".container");
                var content = jQuery(".content", container);
                var bulk = jQuery(".bulk", content);
                var activeRows = jQuery(".table-row.active", bulk);

                // determines if the current bulk panel is selected under
                // the verything mode, if that's the case the operation is
                // going to be performed for the complete set of elements
                var isEverything = bulk.hasClass("everything");

                // starts the ids value string to the default (empty)
                // value and then iterates over the various active rows
                // to appends the id values of each to the string
                var ids = "";
                activeRows.each(function(index, element) {
                    var _element = jQuery(this);
                    ids += _element.attr("data-id") + ",";
                });

                // in case the everything mode is active the gathered
                // ids are ignored as the selection is going to be
                // performed on the server side
                ids = isEverything ? "" : ids;

                // retrieves the current (base) link/action value
                // for the element and adds the ids value to it
                // making the complete link value (with identifiers)
                var link = element.attr("action");
                var hasGet = link.indexOf("?") !== -1;
                var separator = hasGet ? "&" : "?";
                var completeLink = link + separator + "ids=" + ids;

                // changes the action attribute of the form so that
                // it represents the "new" complete link value
                element.attr("action", completeLink);
            });

            // registers for the change operation in the header checkbox
            // so that the various checkboxes are selected or unselected
            headerCheckbox.bind("change", function() {
                var element = jQuery(this);
                var bulk = element.parents(".bulk");
                var checked = element.is(":checked");
                if (checked) {
                    _selectAll(bulk, options);
                } else {
                    _deselectAll(bulk, options);
                }
                bulk.removeClass("partial");
                element.removeClass("partial");
                _updateState(bulk, options);
            });

            // registers for the "simple" change operation in the
            // body checkboxes so that a single line is toggled
            bodyCheckboxes.bind("change", function() {
                var element = jQuery(this);
                var bulk = element.parents(".bulk");
                var tableRow = element.parents(".table-row");
                var checked = element.is(":checked");
                if (checked) {
                    _selectSingle(tableRow);
                } else {
                    _deselectSingle(tableRow, true);
                }
                _updateState(bulk, options);
            });

            // registers for the click operation in the
            // table all selector to select everything
            tableAllSelector.click(function() {
                var element = jQuery(this);
                var bulk = element.parents(".bulk");
                _selectEverything(bulk, options);
            });

            // registers for the click operation in the
            // table all deselector to deselect everything
            tableAllDeselector.click(function() {
                var element = jQuery(this);
                var bulk = element.parents(".bulk");
                _deselectEverything(bulk, options);
            });
        };

        var _selectAll = function(matchedObject, options) {
            // retrieves the complete set of table rows from the body
            // and then applies the select operation in each of the rows
            var rows = jQuery("tbody .table-row", matchedObject);
            rows.each(function(index, element) {
                var _element = jQuery(this);
                _selectSingle(_element);
            });
        };

        var _deselectAll = function(matchedObject, options) {
            // retrieves the complete set of table rows from the body
            // and then applies the deselect operation in each of the rows
            var rows = jQuery("tbody .table-row", matchedObject);
            rows.each(function(index, element) {
                var _element = jQuery(this);
                _deselectSingle(_element, false);
            });
        };

        var _selectEverything = function(matchedObject, options) {
            // adds the everything class to the matched object
            // and then runs the update state operation
            matchedObject.addClass("everything");
            _updateState(matchedObject, options);
        };

        var _deselectEverything = function(matchedObject, options) {
            // removes the everything class to the matched object
            // and then runs the update state operation
            matchedObject.removeClass("everything");
            _deselectAll(matchedObject, options);
            _updateState(matchedObject, options);
        };

        var _updateState = function(matchedObject, options) {
            // runs the complete set of state updating operation
            // associated with the current extension
            _updatePartial(matchedObject, options);
            _updateEverything(matchedObject, options);
        };

        var _updatePartial = function(matchedObject, options) {
            // gathers the reference to the header and body checkboxes
            // (including the ones that are checked), these are going
            // to be used to detect the correct header checkbox state
            var headerCheckbox = jQuery("thead input[type=checkbox]",
                matchedObject);
            var bodyCheckboxes = jQuery("tbody input[type=checkbox]",
                matchedObject);
            var bodyCheckboxesChecked = jQuery(
                "tbody input[type=checkbox]:checked", matchedObject);

            // tries to determine the correct flag values for the header
            // checkbox from both the length values of checkboxed
            var isPartial = bodyCheckboxes.length !== bodyCheckboxesChecked.length;
            var isNotEmpty = bodyCheckboxesChecked.length !== 0;
            isPartial = isPartial && isNotEmpty;

            // resets the state of the header checkbox and then applies the
            // delta values taking into account the various flags
            matchedObject.removeClass("partial");
            matchedObject.removeClass("selection");
            headerCheckbox.removeClass("partial");
            headerCheckbox.attr("checked", false);
            headerCheckbox.prop && headerCheckbox.prop("checked", false);
            isPartial && matchedObject.addClass("partial");
            isNotEmpty && matchedObject.addClass("selection");
            isPartial && headerCheckbox.addClass("partial");
            isNotEmpty && headerCheckbox.attr("checked", true);
            isNotEmpty && headerCheckbox.prop && headerCheckbox.prop("checked", true);

            // uses the is not empty flag to decide on whether or not to show
            // the operations (button) for drop down usage and activation
            isNotEmpty
                ? _showOperations(matchedObject) : _hideOperations(matchedObject);

            // updates the various state variables for the current bulk
            // selection table so that it may be checked
            matchedObject.data("selected", bodyCheckboxesChecked.length);

            // triggers the proper value change event so that possible
            // event listeners may change their current status
            matchedObject.triggerHandler("value_change", [bodyCheckboxesChecked.length]);
        };

        var _updateEverything = function(matchedObject, options) {
            // retrieves the various elements associated with the table
            // all section of the table (to be changed)
            var tableHeaders = jQuery("thead th", matchedObject);
            var tableAll = jQuery("tbody .table-all", matchedObject);
            var tableAllColumn = jQuery("td", tableAll);
            var tableAllMessage = jQuery(".message", tableAllColumn);
            var tableAllSelector = jQuery(".selector", tableAllColumn);
            var tableAllDeselector = jQuery(".deselector", tableAllColumn);

            // determines the kind of selection that is currently present
            // in the bulk table (everything, total or partial)
            var isSelected = matchedObject.hasClass("selection");
            var isPartial = matchedObject.hasClass("partial");
            var isEverything = matchedObject.hasClass("everything");
            var isTotal = isSelected && !isPartial;

            // retrieves the various attributes that are going to be used
            // to build the proper end user message
            var size = matchedObject.attr("data-size");
            var total = matchedObject.attr("data-total");
            var templateAll = matchedObject.attr("data-all");

            // determines the count value that is going to be presented
            // to the end user taking into account the current selection
            // state (everyting or other)
            var count = isEverything ? total : size;

            // calculates the number of columns in the current table as
            // the number of header columns in the table (should be equivalent)
            var numberColumns = tableHeaders.length;

            // retrieves the proper template value and then applies the
            // (item) count value to it and changed the table all message
            templateAll = templateAll || "All %s items on this page are selected.";
            var messageAll = templateAll.formatC(count);
            tableAllMessage.text(messageAll);

            // tries to determine the amount of pages available for the
            // current bulk table and considers the current bulk table
            // to be multiple (pages) if that value is greater than one
            var pages = matchedObject.attr("data-pages") || "1";
            pages = parseInt(pages);
            var multiple = pages > 1;

            // verifies if this is a table total selection and if that's
            // the case show the table all section, note that the colspan
            // attribute of the table all column is updated according to
            // the current specification of the table
            if (isTotal && multiple) {
                tableAllColumn.attr("colspan", String(numberColumns));
                tableAll.show();
            }
            // otherwise hide the table all section and removes the
            // everything class from the bulk element
            else {
                tableAll.hide();
                matchedObject.removeClass("everything");
            }

            // verifies if this is a everything situation and taking
            // that into account toggles the visibility of the selector
            // or deselector of the everything button/action
            if (isEverything) {
                tableAllSelector.hide();
                tableAllDeselector.show();
            } else {
                tableAllSelector.show();
                tableAllDeselector.hide();
            }
        };

        var _selectSingle = function(element) {
            // retrieves the reference to the current line's checkbox and
            // then adds the active class to the current element and runs
            // the select operation to the current checkbox
            var checkbox = jQuery("input[type=checkbox]", element);
            element.addClass("active");
            checkbox.attr("checked", true);
            checkbox.prop && checkbox.prop("checked", true);
        };

        var _deselectSingle = function(element) {
            // retrieves the reference to the current line's checkbox and
            // then remomoves the active class from the current element and
            // runs the deselect operation to the current checkbox
            var checkbox = jQuery("input[type=checkbox]", element);
            element.removeClass("active");
            checkbox.attr("checked", false);
            checkbox.prop && checkbox.prop("checked", false);
        };

        var _showOperations = function(element, force) {
            var content = element.parents(".content");
            var operations = jQuery(".drop-down.operations", content);
            var container = operations.parents(".drop-down-container");
            var button = jQuery(".button-drop-down", container);
            var dropDown = jQuery(".drop-down", container);
            var elements = jQuery("> li", dropDown);
            var isEmpty = elements.length === 0;
            if (isEmpty && !force) {
                return;
            }
            container.css("display", "inline-block");
            button.css("display", "inline-block");
        };

        var _hideOperations = function(element) {
            var content = element.parents(".content");
            var operations = jQuery(".drop-down.operations", content);
            var container = operations.parents(".drop-down-container");
            var button = jQuery(".button-drop-down", container);
            container.hide();
            button.hide();
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

        // retrieves the reference to the bulk editing compoment and then
        // registers for the proper operations in it
        var bulk = jQuery(".bulk", matchedObject);
        bulk.ubulk();
    };
})(jQuery);

jQuery(document).ready(function() {
    var _body = jQuery("body");
    _body.bind("applied", function(event, base) {
        base.lapply();
    });
});
