(function(jQuery){jQuery.fn.uasync=function(){var matchedObject=this;var _validate=function(){var _body=jQuery("body");var async=!_body.hasClass("noajax");return window.FormData?async:false;};var _registerHandlers=function(){var _body=jQuery("body");var links=jQuery("a[href], .link[href]",matchedObject);links=links.filter(":not(.link-confirm)");links.click(function(event){if(event.metaKey||event.ctrlKey){return;}
if(event.which==2||event.which==3){return;}
var element=jQuery(this);var href=element.attr("href");var noAsync=element.hasClass("no-async");if(noAsync){return;}
var result=jQuery.uxlinkasync(href,false);result&&event.preventDefault();});var async=_body.data("async")||false;if(async){return;}
_body.bind("data",function(event,data,href,uuid,push,hbase){uuid=uuid||jQuery.uxguid();hbase=hbase||href;var relative=href.replace(/^(?:\/\/|[^\/]+)*\//,"/");var state={uuid:uuid,href:href};try{data=data.replace(/src=/ig,"aux-src=");var base=jQuery(data);var bodyData=data.match(/<body.*>[^\0]*<\/body>/ig)[0];bodyData=bodyData.replace("body","body_");var body=jQuery(bodyData);var _isValid=isBodyValid();var _isContentsValid=isContentsValid(body);var _isBaseValid=isBaseValid(base);var isValid=_isValid&&_isContentsValid&&_isBaseValid;if(!isValid){throw"Invalid layout or layout not found";}
var isFull=type(body)!=type();isFull=isFull||hash(body)!=hash();_body.triggerHandler("pre_async");_body.hide();if(isFull){updateFull(base,body);}else{updateSimple(base,body);}
_body.triggerHandler("do_async",[base,body]);updateGuid(uuid);_body.show();_body.scrollTop(0);_body.triggerHandler("post_async");push&&window.history.pushState(state,null,href);push&&window._gaq&&_gaq.push(["_trackPageview",relative]);push&&window.ga&&ga("send",{hitType:"pageview",page:relative});push&&window.google_trackConversion&&trackConversion();}catch(exception){document.location=href;}});_body.bind("async",function(){var _isValid=isBodyValid();return _isValid;});_body.bind("async_start",function(){var barLoader=jQuery(".bar-loader");if(barLoader.length==0){var barLoader=jQuery("<div class=\"bar-loader\"></div>");_body.prepend(barLoader);}
var topLoader=jQuery(".top-loader");if(topLoader.length==0){var topLoader=jQuery("<div class=\"top-loader\">"+"<div class=\"loader-background\"></div>"+"</div>");_body.prepend(topLoader);}
barLoader.addClass("loading");topLoader.addClass("loading");var isVisible=topLoader.css("opacity")=="1";if(!isVisible){return;}
topLoader.width(0);topLoader.show();topLoader.animate({width:60},100);});_body.bind("async_end",function(){var barLoader=jQuery(".bar-loader");var topLoader=jQuery(".top-loader");setTimeout(function(){barLoader.removeClass("loading");topLoader.removeClass("loading");},350);var isVisible=topLoader.css("opacity")=="1";if(!isVisible){return;}
var parent=topLoader.parent();var width=parent.outerWidth(false);topLoader.animate({width:width},350,function(){var isVisible=topLoader.is(":visible");if(isVisible){topLoader.fadeOut(150);}else{topLoader.hide();}});});_body.bind("location",function(event,location){var result=jQuery.uxlinkasync(location,false);return!result;});_body.data("async",true);};var _setPopHandler=function(){if(window.onpopstate!=null){return;}
var href=document.location.href;var state={uuid:jQuery.uxguid(),href:href};window.history.replaceState(state,null,href);window.onpopstate=function(event){var uuid=event.state?event.state.uuid:null;if(event.state==null){var href=document.location.href;var state={uuid:jQuery.uxguid(),href:href};window.history.replaceState(state,null,href);return;}
var href=document.location;jQuery.uxlinkasync(href,true,uuid);};};var result=_validate();if(!result){var _body=jQuery("body");_body.data("async",false);return;}
_registerHandlers();setTimeout(_setPopHandler);};var isStatic=function(body){var body=body||jQuery("body");return body.hasClass("static");};var isFluid=function(body){var body=body||jQuery("body");return body.hasClass("fluid");};var isSimple=function(body){var body=body||jQuery("body");return body.hasClass("simple");};var type=function(body){if(isStatic(body)){return"static";}
if(isFluid(body)){return"fluid";}
if(isSimple(body)){return"simple";}
return"static";};var hash=function(body){var buffer="";var body=body||jQuery("body");buffer+=body.hasClass("static")?"1":"0";buffer+=body.hasClass("fluid")?"1":"0";buffer+=jQuery("#header",body).length?"1":"0";buffer+=jQuery("#content",body).length?"1":"0";buffer+=jQuery("#footer",body).length?"1":"0";buffer+=jQuery("#windows",body).length?"1":"0";buffer+=jQuery(".action-bar",body).length?"1":"0";return buffer;};var isBodyValid=function(){var hasContent=jQuery("#content").length>0;if(!hasContent){return false;}
return true;};var isContentsValid=function(body){var _body=jQuery("body");var isFramework=body.hasClass("ux");if(!isFramework){return false;}
var identifier=body.attr("data-id");var identifier_=_body.attr("data-id");var isCompatible=identifier==identifier_;if(!isCompatible){return false;}
return true;};var isBaseValid=function(base){var hasContent=base.filter("#content");if(!hasContent){return false;}
return true;};var updateGuid=function(uuid){var _body=jQuery("body");_body.attr("uuid",uuid);};var updateFull=function(base,body){updateBody(body);updateBodyFull(body);updateTitle(base);updateIcon(base);updateMeta(base);};var updateSimple=function(base,body){updateBody(body);updateTitle(base);updateIcon(base);updateLinks(base);updateSideLinks(base);updateActionBar(base);updateNotifications(base);updateWindows(base);updateHeader(base);updateContent(base);updateFooter(base);updateMeta(base);fixFluid();};var updateBody=function(body){var _body=jQuery("body");var bodyClass=body.attr("class");_body.attr("class",bodyClass);_body.uxbrowser();_body.uxfeature();_body.uxmobile();_body.uxresponsive();};var updateBodyFull=function(body){var _body=jQuery("body");var bodyHtml=body.html();bodyHtml=bodyHtml.replace(/aux-src=/ig,"src=");_body.html(bodyHtml);_body.show();_body.uxapply();_body.hide();};var updateTitle=function(base){var title=base.filter("title");var title_=jQuery("title");var titleHtml=title.html();title_.html(titleHtml);};var updateIcon=function(base){var icon=base.filter("link[rel='shortcut icon']");var icon_=jQuery("link[rel='shortcut icon']");var iconHref=icon.attr("href");icon_.attr("href",iconHref);};var updateMeta=function(base){var meta=base.filter(".meta");var meta_=jQuery(".meta");var metaHtml=meta.html();meta_.html(metaHtml);meta_.uxapply();};var updateLinks=function(base){var links=jQuery("> .links",base);var links_=jQuery("#header > .links");var header=jQuery("#header");links_.remove();header.append(links);var links_=jQuery("#header > .links");links_.uxapply();};var updateSideLinks=function(base){var sideLinks=jQuery("> .side-links",base);var sideLinks_=jQuery("#header > .side-links");var sideLinksClass=sideLinks.attr("class")
var sideLinksHtml=sideLinks.html();sideLinksHtml=sideLinksHtml&&sideLinksHtml.replace(/aux-src=/ig,"src=");sideLinks_.html(sideLinksHtml);sideLinks_.attr("class",sideLinksClass);sideLinks_.uxapply();};var updateActionBar=function(base){var actionBar=jQuery(".action-bar",base);var actionBar_=jQuery(".action-bar");var actionBarClass=actionBar.attr("class")
var actionBarHtml=actionBar.html();actionBarHtml=actionBarHtml&&actionBarHtml.replace(/aux-src=/ig,"src=");actionBar_.html(actionBarHtml);actionBar_.attr("class",actionBarClass);actionBar_.uxapply();};var updateNotifications=function(base){var notifications=base.filter(".header-notifications-container");var notifications_=jQuery(".header-notifications-container");var notificationsHtml=notifications.html();notifications_.html(notificationsHtml);};var updateWindows=function(base){var windows=base.filter("#windows");var windows_=jQuery("#windows");var windowsClass=windows.attr("class");var windowsHtml=windows.html();windowsHtml=windowsHtml&&windowsHtml.replace(/aux-src=/ig,"src=");windows_.html(windowsHtml);windows_.attr("class",windowsClass);windows_.uxapply();};var updateHeader=function(base){var header_=jQuery("#header");var isFull=header_.hasClass("replace");isFull?updateHeaderFull(base):updateHeaderSimple(base);};var updateHeaderSimple=function(base){var header=base.filter("#header");var header_=jQuery("#header");var container=jQuery(".header-container",header);var container_=jQuery(".header-container",header_);var title=jQuery("> h1",header);var title_=jQuery("> h1",header_);var containertHtml=container.html();containertHtml=containertHtml&&containertHtml.replace(/aux-src=/ig,"src=");container_.html(containertHtml);container_.uxapply();var titleHtml=title.html();titleHtml=titleHtml&&titleHtml.replace(/aux-src=/ig,"src=");title_.html(titleHtml);title_.uxapply();};var updateHeaderFull=function(base){var header=base.filter("#header");var header_=jQuery("#header");var headerClass=header.attr("class");var headerHtml=header.html();headerHtml=headerHtml&&headerHtml.replace(/aux-src=/ig,"src=");header_.html(headerHtml);header_.attr("class",headerClass);header_.uxapply();};var updateContent=function(base){var content=base.filter("#content");var content_=jQuery("#content");var contentClass=content.attr("class");var contentHtml=content.html();contentHtml=contentHtml.replace(/aux-src=/ig,"src=");content_.html(contentHtml);content_.attr("class",contentClass);content_.uxapply();content_.uxshortcuts();};var updateFooter=function(base){var footer=base.filter("#footer");var footer_=jQuery("#footer");var footerClass=footer.attr("class");var footerHtml=footer.html();footerHtml=footerHtml&&footerHtml.replace(/aux-src=/ig,"src=");footer_.html(footerHtml);footer_.attr("class",footerClass);footer_.uxapply();};var fixFluid=function(){var _body=jQuery("body");var isFluid=_body.hasClass("fluid");if(!isFluid){return;}
var content=jQuery("#content");var contentContainer=jQuery(".content-container",content);contentContainer.addClass("border-box");};var trackConversion=function(){var meta=jQuery(".meta");var conversionId=jQuery("[name=adwords-conversion-id]",meta);var itemId=jQuery("[name=adwords-dynx-itemid]",meta);var totalValue=jQuery("[name=adwords-dynx-totalvalue]",meta);var pageType=jQuery("[name=adwords-dynx-pagetype]",meta);if(!window.google_trackConversion){return;}
if(!conversionId||conversionId.length==0){return;}
conversionId=parseInt(conversionId.attr("content"));if(!conversionId){return;}
totalValue=parseFloat(totalValue.attr("content"));pageType=pageType.attr("content");var itemIdList=[];itemId.each(function(index,element){var _element=jQuery(this);var elementId=_element.text();itemIdList.push(elementId);});google_trackConversion({google_conversion_id:conversionId,google_custom_params:{dynx_itemid:itemIdList,dynx_totalvalue:totalValue,dynx_pagetype:pageType},google_remarketing_only:true});};})(jQuery);(function(jQuery){jQuery.fn.ufluid=function(options){var defaults={};var options=options?options:{};var options=jQuery.extend(defaults,options);var matchedObject=this;var initialize=function(){_appendHtml();_registerHandlers();};var _appendHtml=function(){if(matchedObject.length==0){return;}
var elements=jQuery("#header, #content, #footer, #windows",matchedObject);var sideLinks=jQuery(".side-links",matchedObject);var contentContainer=jQuery(".content-container",matchedObject);elements.wrapAll("<div class=\"container\"></div>");_layout(matchedObject,options);sideLinks.data("visible",true);contentContainer.addClass("border-box");};var _registerHandlers=function(){if(matchedObject.length==0){return;}
var topBar=jQuery(".top-bar",matchedObject);var sideLinks=jQuery(".side-links",matchedObject);var logoLink=jQuery(".logo > a",topBar);var dropField=jQuery(".drop-field",topBar);logoLink.click(function(){sideLinks.triggerHandler("toggle");});sideLinks.bind("toggle",function(){var element=jQuery(this);var isVisible=element.data("visible");if(isVisible){element.triggerHandler("hide");}else{element.triggerHandler("show");}});sideLinks.bind("show",function(){var element=jQuery(this);var isVisible=element.data("visible");if(isVisible){return;}
element.data("visible",true);element.show();var duration=_isFixed()?0:350;element.animate({left:0},{duration:duration,easing:"swing",complete:function(){_layout(matchedObject,options);},progress:function(){_layout(matchedObject,options);}});});sideLinks.bind("hide",function(){var element=jQuery(this);var isVisible=element.data("visible");if(!isVisible){return;}
element.data("visible",false);var width=element.outerWidth(true);var duration=_isFixed()?0:350;element.animate({left:width*-1},{duration:duration,easing:"swing",complete:function(){element.hide();_layout(matchedObject,options);},progress:function(){_layout(matchedObject,options);}});});dropField.bind("value_select",function(){var element=jQuery(this);element.uxreset();element.blur();});};var _layout=function(element,options){var content=jQuery("#content",matchedObject);var sideLinks=jQuery(".side-links",matchedObject);var sideLinksVisible=sideLinks.is(":visible");var sideLinksWidth=sideLinks.outerWidth(true);var sideLinksLeft=sideLinks.css("left");sideLinksLeft=parseInt(sideLinksLeft);sideLinksLeft=sideLinksLeft?sideLinksLeft:0;sideLinksWidth+=sideLinksLeft;sideLinksWidth=sideLinksVisible?sideLinksWidth:0;content.css("margin-left",sideLinksWidth+"px");};var _isFixed=function(){var _body=jQuery("body");return _body.hasClass("fixed");};initialize();return this;};})(jQuery);(function(jQuery){jQuery.fn.ulinksextra=function(options){var defaults={};var options=options?options:{};var options=jQuery.extend(defaults,options);var matchedObject=this;var initialize=function(){_appendHtml();_registerHandlers();};var _appendHtml=function(){if(matchedObject.length==0){return;}
var links=matchedObject.parents(".links");var linkMore=jQuery(".link-more",links);var linksElements=jQuery("> a",links);var linksExtra=jQuery("li",matchedObject);var extraSize=linksExtra.length;if(extraSize==0){linkMore.hide();}
var size=linksElements.length;var element=size>2?linksElements[size-2]:null;var activeLink=jQuery("a.active",matchedObject);var activeItem=activeLink.parent("li");if(activeLink.length!=0){activeLink.insertAfter(element);activeItem.append(element);}
_updatePosition(matchedObject,options);};var _registerHandlers=function(){if(matchedObject.length==0){return;}
var _document=jQuery(document);var linkMore=jQuery(".link-more > .link");var links=jQuery("a",matchedObject);matchedObject.bind("hide",function(){var element=jQuery(this);var isVisible=element.is(":visible");if(!isVisible){return;}
var link=element.data("link");link.removeClass("hover");element.css("display","none");});linkMore.click(function(event){var element=jQuery(this);var linksExtra=jQuery(".links-extra");var isVisible=linksExtra.is(":visible");if(isVisible){element.removeClass("hover");linksExtra.css("display","none");}else{element.addClass("hover");linksExtra.css("display","inline");linksExtra.data("link",element);}
_updatePosition(linksExtra,options);event.stopPropagation();event.preventDefault();});links.click(function(event){event.stopPropagation();});_document.click(function(){matchedObject.triggerHandler("hide");});};var _updatePosition=function(matchedObject,options){var positioned=matchedObject.hasClass("positioned");if(positioned){return;}
var links=matchedObject.parents(".links");var linkMore=jQuery(".link-more",links);var width=matchedObject.outerWidth(true);var linkMoreWidth=linkMore.outerWidth(true);var isValid=width!=0&&linkMoreWidth!=0;var extraWidth=(width-linkMoreWidth)*-1;isValid&&matchedObject.css("margin-left",extraWidth+"px");isValid&&matchedObject.addClass("positioned");};initialize();return this;};})(jQuery);(function(jQuery){jQuery.fn.ubulk=function(options){var defaults={};var options=options?options:{};var options=jQuery.extend(defaults,options);var matchedObject=this;var initialize=function(){_appendHtml();_registerHandlers();};var _appendHtml=function(){var content=matchedObject.parents(".content");var operations=jQuery(".drop-down.operations",content);var operationsLinks=jQuery("> li > a",operations);operationsLinks.addClass("no-async");matchedObject.each(function(index,element){var _element=jQuery(this);var tableBody=jQuery("tbody",matchedObject);var size=_element.attr("data-size");var total=_element.attr("data-total");var templateAll=_element.attr("data-all");var templateSelect=_element.attr("data-select");var templateDeselect=_element.attr("data-deselect");tableBody.prepend("<tr class=\"table-all\"></tr>");var tableAll=jQuery(".table-all",tableBody);templateAll=templateAll||"All %s items on this page are selected.";templateSelect=templateSelect||"Select all %s items";templateDeselect=templateDeselect||"Clear all";var messageAll=templateAll.formatC(size);var messageSelect=templateSelect.formatC(total);var messageDeselect=templateDeselect;tableAll.append("<td colspan=\"99\">"+"<span class=\"message\">"+messageAll+"</span>"+"<a class=\"selector\">"+messageSelect+"</a>"+"<a class=\"deselector\">"+messageDeselect+"</a>"+"</td>");_updateState(_element,options);});};var _registerHandlers=function(){var _body=jQuery("body");var container=matchedObject.parents(".container");var content=matchedObject.parents(".content");var operationsWindows=jQuery(".window.window-operation",container);var operations=jQuery(".drop-down.operations",content);var operationsLinks=jQuery("> li > a",operations);var operationsForms=jQuery("> form",operationsWindows);var headerCheckbox=jQuery("thead input[type=checkbox]",matchedObject);var bodyCheckboxes=jQuery("tbody input[type=checkbox]",matchedObject);var tableAll=jQuery("tbody .table-all",matchedObject);var tableAllSelector=jQuery(".selector",tableAll);var tableAllDeselector=jQuery(".deselector",tableAll);operationsLinks.click(function(){var element=jQuery(this);var content=element.parents(".content");var bulk=jQuery(".bulk",content);var activeRows=jQuery(".table-row.active",bulk);var window=element.attr("data-window_open");if(window){return;}
var isEverything=bulk.hasClass("everything");var total=bulk.attr("data-total");var count=isEverything?total:activeRows.length;var template=bulk.attr("data-message");template=template||"Are you sure you want to perform ['%s'] ?\\n"+"The operation is going to be performed for [%s entities].";var message=template.formatC(element.text(),count);var ids="";activeRows.each(function(index,element){var _element=jQuery(this);ids+=_element.attr("data-id")+",";});ids=isEverything?"":ids;var link=element.attr("href");var hasGet=link.indexOf("?")!=-1;var separator=hasGet?"&":"?";var completeLink=link+separator;completeLink+=ids?"ids="+ids:"";_body.uxconfirm(message,function(result){if(result==false){return;}
element.attr("href",completeLink);jQuery.uxlocation(completeLink);});event.preventDefault();});operationsForms.bind("pre_submit",function(){var element=jQuery(this);var container=element.parents(".container");var content=jQuery(".content",container);var bulk=jQuery(".bulk",content);var activeRows=jQuery(".table-row.active",bulk);var isEverything=bulk.hasClass("everything");var ids="";activeRows.each(function(index,element){var _element=jQuery(this);ids+=_element.attr("data-id")+",";});ids=isEverything?"":ids;var link=element.attr("action");var hasGet=link.indexOf("?")!=-1;var separator=hasGet?"&":"?";var completeLink=link+separator+"ids="+ids;element.attr("action",completeLink);});headerCheckbox.bind("change",function(){var element=jQuery(this);var bulk=element.parents(".bulk");var checked=element.attr("checked");if(checked){_selectAll(bulk,options);}else{_deselectAll(bulk,options);}
bulk.removeClass("partial");element.removeClass("partial");_updateState(bulk,options);});bodyCheckboxes.bind("change",function(){var element=jQuery(this);var bulk=element.parents(".bulk");var tableRow=element.parents(".table-row");var checked=element.attr("checked");if(checked){_selectSingle(tableRow);}else{_deselectSingle(tableRow,true);}
_updateState(bulk,options);});tableAllSelector.click(function(){var element=jQuery(this);var bulk=element.parents(".bulk");_selectEverything(bulk,options);});tableAllDeselector.click(function(){var element=jQuery(this);var bulk=element.parents(".bulk");_deselectEverything(bulk,options);});};var _selectAll=function(matchedObject,options){var rows=jQuery("tbody .table-row",matchedObject);rows.each(function(index,element){var element=jQuery(this);_selectSingle(element);});};var _deselectAll=function(matchedObject,options){var rows=jQuery("tbody .table-row",matchedObject);rows.each(function(index,element){var element=jQuery(this);_deselectSingle(element,false);});};var _selectEverything=function(matchedObject,options){matchedObject.addClass("everything");_updateState(matchedObject,options);};var _deselectEverything=function(matchedObject,options){matchedObject.removeClass("everything");_deselectAll(matchedObject,options);_updateState(matchedObject,options);};var _updateState=function(matchedObject,options){_updatePartial(matchedObject,options);_updateEverything(matchedObject,options);};var _updatePartial=function(matchedObject,options){var headerCheckbox=jQuery("thead input[type=checkbox]",matchedObject);var bodyCheckboxes=jQuery("tbody input[type=checkbox]",matchedObject);var bodyCheckboxesChecked=jQuery("tbody input[type=checkbox]:checked",matchedObject);var isPartial=bodyCheckboxes.length!=bodyCheckboxesChecked.length;var isNotEmpty=bodyCheckboxesChecked.length!=0;isPartial=isPartial&&isNotEmpty;matchedObject.removeClass("partial");matchedObject.removeClass("selection");headerCheckbox.removeClass("partial");headerCheckbox.attr("checked",false);isPartial&&matchedObject.addClass("partial");isNotEmpty&&matchedObject.addClass("selection");isPartial&&headerCheckbox.addClass("partial");isNotEmpty&&headerCheckbox.attr("checked",true);isNotEmpty?_showOperations(matchedObject):_hideOperations(matchedObject);matchedObject.data("selected",bodyCheckboxesChecked.length);matchedObject.triggerHandler("value_change",[bodyCheckboxesChecked.length]);};var _updateEverything=function(matchedObject,options){var tableHeaders=jQuery("thead th",matchedObject);var tableAll=jQuery("tbody .table-all",matchedObject);var tableAllColumn=jQuery("td",tableAll);var tableAllMessage=jQuery(".message",tableAllColumn);var tableAllSelector=jQuery(".selector",tableAllColumn);var tableAllDeselector=jQuery(".deselector",tableAllColumn);var isSelected=matchedObject.hasClass("selection");var isPartial=matchedObject.hasClass("partial");var isEverything=matchedObject.hasClass("everything");var isTotal=isSelected&&!isPartial;var size=matchedObject.attr("data-size");var total=matchedObject.attr("data-total");var templateAll=matchedObject.attr("data-all");var count=isEverything?total:size;var numberColumns=tableHeaders.length;templateAll=templateAll||"All %s items on this page are selected.";var messageAll=templateAll.formatC(count);tableAllMessage.text(messageAll);var pages=matchedObject.attr("data-pages")||"1";pages=parseInt(pages);var multiple=pages>1;if(isTotal&&multiple){tableAllColumn.attr("colspan",String(numberColumns));tableAll.show();}
else{tableAll.hide();matchedObject.removeClass("everything");}
if(isEverything){tableAllSelector.hide();tableAllDeselector.show();}else{tableAllSelector.show();tableAllDeselector.hide();}};var _selectSingle=function(element){var checkbox=jQuery("input[type=checkbox]",element);element.addClass("active");checkbox.attr("checked",true);};var _deselectSingle=function(element){var checkbox=jQuery("input[type=checkbox]",element);element.removeClass("active");checkbox.attr("checked",false);};var _showOperations=function(element,force){var content=element.parents(".content");var operations=jQuery(".drop-down.operations",content);var container=operations.parents(".drop-down-container");var button=jQuery(".button-drop-down",container);var dropDown=jQuery(".drop-down",container);var elements=jQuery("> li",dropDown);var isEmpty=elements.length==0;if(isEmpty&&!force){return;}
container.css("display","inline-block");button.css("display","inline-block");};var _hideOperations=function(element){var content=element.parents(".content");var operations=jQuery(".drop-down.operations",content);var container=operations.parents(".drop-down-container");var button=jQuery(".button-drop-down",container);container.hide();button.hide();};initialize();return this;};})(jQuery);(function(jQuery){jQuery.fn.lapply=function(options){var matchedObject=this;matchedObject.uasync();var fluid=matchedObject.filter("body.fluid");fluid.ufluid();var linksExtra=jQuery(".links-extra",matchedObject);linksExtra.ulinksextra();var bulk=jQuery(".bulk",matchedObject);bulk.ubulk();};})(jQuery);jQuery(document).ready(function(){var _body=jQuery("body");_body.bind("applied",function(event,base){base.lapply();});});
