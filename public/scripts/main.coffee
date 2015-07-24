cacheIndex = 0;
smallImgSize="160x120"
regImgSize="560x365"
largeImgSize="640x480"
streetViewUrl = "/google/streetview?dir=front&size=#{largeImgSize}"
streetViewSaveFrontUrl = "/google/streetview?dir=front&size=#{regImgSize}"
streetViewSaveLeftUrl = "/google/streetview?dir=left&size=#{regImgSize}"
streetViewSaveRightUrl = "/google/streetview?dir=right&size=#{regImgSize}"
streetViewSaveRearUrl = "/google/streetview?dir=rear&size=#{regImgSize}"
streetViewLeftUrl = "/google/streetview?dir=left&size=#{smallImgSize}"
streetViewRightUrl = "/google/streetview?dir=right&size=#{smallImgSize}"
streetViewRearUrl = "/google/streetview?dir=rear&size=#{smallImgSize}"
streetViewClickUrl = "/google/streetview/clickthrough?dir=front"
streetViewClickLeftUrl = "/google/streetview/clickthrough?dir=left"
streetViewClickRightUrl = "/google/streetview/clickthrough?dir=right"
streetViewClickRearUrl = "/google/streetview/clickthrough?dir=rear"
routeUrl = "/google/routemap"
routeClickUrl = "/google/routemap/clickthrough"
headerText = "<p>Distance covered today: <strong>SSSSS</strong> steps - <strong>NNN</strong> miles<br />\
Distance traveled so far: <strong>NNN.NN miles</strong><br />\
Route coordinates: COORDS<br />\
Walking date: <strong>DDth MMMMM</strong></p>\
<hr><p><em>I'm traveling from <a href='http://thevirtualwalker.blogspot.co.uk/2013/09/from-lands-end-to-john-o-groats.html'>Land's End to John O' Groats</a> by means of <a href='http://maps.google.co.uk'>Google Street View</a> and <a href='http://www.fitbit.com'>Fitbit</a>. In other words I have actually walked every mile I log, just in a more mundane location. This blog records the route I might have taken, if I had the luxury of taking a few months off work!</em></p>"

userSession = null

$.get "/usersession", (uSess) =>
    userSession = uSess;
    if userSession.blogText? then $("#blogMarkup").val(userSession.blogText)

$("#blogMarkup").focusout () =>
    userSession.blogText = $("#blogMarkup").val()
    $.post "/usersession", userSession

updateViews = () =>
    $("#streetviewFront").attr("src",streetViewUrl+"&ci="+cacheIndex)
    $("#streetviewLeft").attr("src",streetViewLeftUrl+"&ci="+cacheIndex)  
    $("#streetviewRight").attr("src",streetViewRightUrl+"&ci="+cacheIndex)  
    $("#streetviewRear").attr("src",streetViewRearUrl+"&ci="+cacheIndex) 
    $("#routemapImage").attr("src",routeUrl+"?ci="+cacheIndex)
    cacheIndex++

addImageUploadHandler = (buttonId, imgUrl, clickUrl) =>
    $(buttonId).click (e) ->
        $.post(imgUrl).done (viewImg) ->
            $.get(clickUrl).done (viewLink) ->
                blogText = "<h4>HEADING TEXT</h4>\n
                            <p>BLURB</p>\n
                            <a href='http://#{viewLink.url}' imageanchor='1' >\n
                                <img border='0' src='http://#{viewImg.url}' alt='SHORT BLURB' width='560' height='365' />\n
                            </a>\n<br />\n&nbsp;\n<br />\n\n"
                $("#blogMarkup").val($("#blogMarkup").val() + blogText)


addImageUploadHandler "#streetviewAdd", streetViewSaveFrontUrl, streetViewClickUrl
addImageUploadHandler "#streetviewLeftAdd", streetViewSaveLeftUrl, streetViewClickLeftUrl
addImageUploadHandler "#streetviewRightAdd", streetViewSaveRightUrl, streetViewClickRightUrl
addImageUploadHandler "#streetviewRearAdd", streetViewSaveRearUrl, streetViewClickRearUrl


$("#routemapAdd").click (e) ->
    $.post(routeUrl).done (routeImg) ->
        $.get(routeClickUrl).done (routeLink) ->
            blogText = "<a href='http://#{routeLink.url}' imageanchor='1'>\n
                            <img border='0' src='http://#{routeImg.url}' alt='Today''s route' width='560' height='365' />\n
                        </a>\n<br />\n&nbsp;<br />\n\n"
            $("#blogMarkup").val($("#blogMarkup").val() + blogText)

$("#load").click (e) ->
    route = $("#route").val()
  
    $.post("startroute", {points: route}).done( () ->
        updateViews();
        markup = $("#blogMarkup")
        if markup.val() == "" then markup.val(headerText);
    ).error( () -> alert("startroute failed") )

$("#next").click (e) ->
  $.post("movenext").done updateViews

$("#next20").click (e) ->
  $.post("movenext?steps=20").done updateViews

$("#prev").click (e) ->
  $.post("moveprev").done updateViews
  
$("#prev20").click (e) ->
  $.post("moveprev?steps=20").done updateViews

