$(function(){
  var cacheIndex = 0;
  var streetViewUrl = '/google/streetview?dir=front&size=640x480';
  var streetViewLeftUrl = '/google/streetview?dir=left&size=160x120';
  var streetViewRightUrl = '/google/streetview?dir=right&size=160x120';
  var streetViewRearUrl = '/google/streetview?dir=rear&size=160x120';
  var streetViewClickUrl = '/google/streetview/clickthrough?dir=front';
  var routeUrl = '/google/routemap';
  var routeClickUrl = '/google/routemap/clickthrough';
  
  var userSession = null;
  
  $.get("/usersession", function(uSess) {
      userSession = uSess;
      if(userSession.blogText) {
          $('#blogMarkup').val(userSession.blogText);
      }
      // etc
  });
  
  $('#blogMarkup').focusout(function() {
    userSession.blogText = $('#blogMarkup').val();
    $.post("/usersession", userSession);
  });
  
  var updateViews = function() {
      $('#streetviewFront').attr('src',streetViewUrl+"&ci="+cacheIndex);  
      $('#streetviewLeft').attr('src',streetViewLeftUrl+"&ci="+cacheIndex);  
      $('#streetviewRight').attr('src',streetViewRightUrl+"&ci="+cacheIndex);  
      $('#streetviewRear').attr('src',streetViewRearUrl+"&ci="+cacheIndex);  
      $('#routemapImage').attr('src',routeUrl+"?ci="+cacheIndex);   
      cacheIndex++;
  }
      
  $('#streetviewAdd').click(function(e){
    $.post(streetViewUrl).done(function(viewImg) {
      $.get(streetViewClickUrl).done(function(viewLink) {
        var blogText = '<h4>HEADING TEXT</h4>' +
          '<p>BLURB</p>\n' +
          '<a href="http://' + viewLink.url + '" imageanchor="1" >\n' +
          '    <img border="0" src="http://' + viewImg.url + '" alt="SHORT BLURB" width="560" height="365" />\n' +
          '</a>\n<br />\n&nbsp;\n<br />\n\n';
        $('#blogMarkup').val($('#blogMarkup').val() + blogText);
      });
    });
  });

  $('#routemapAdd').click(function(e){
    $.post(routeUrl).done(function(routeImg) {
      $.get(routeClickUrl).done(function(routeLink) {
        var blogText = '<a href="http://' +routeLink.url + '" imageanchor="1">\n' +
                          '    <img border="0" src="http://' + routeImg.url + '" alt="Today\'s route" width="560" height="365" />\n' +
                          '</a>\n<br />\n&nbsp;<br />\n\n';
        $('#blogMarkup').val($('#blogMarkup').val() + blogText + '\n');
      });
    });
  });
  
  
  $('#load').click(function(e){
    var route = $('#route').val();
    
    $.post('startroute', {points: route}).done(function() {
      updateViews();
    }).error(function() {
      alert('startroute failed');
    });
 });
 
 $('#next').click(function(e){
    $.post('movenext').done(function() {
      updateViews();
    });
 });
 
 $('#prev').click(function(e){
    $.post('moveprev').done(function() {
      updateViews();
    });
 });
});

