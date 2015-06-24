$(function(){
 $('#load').click(function(e){

    // $('#results').attr('src',"/google/streetview?location=51.390755,-3.276851&heading=220&fov=60&size=640x480");
    var route = $('#route').val();
    
    $.get('startroute?points=' + route).done(function() {
      var streetViewUrl = '/google/streetview';
      $('#streetview').attr('src',streetViewUrl);  
      var routeUrl = '/google/routemap';
      $('#routemap').attr('src',routeUrl);
    });
 });
 $('#next').click(function(e){
    $.get('movenext').done(function() {
      var streetViewUrl = '/google/streetview';
      $('#streetview').attr('src',streetViewUrl);  
      var routeUrl = '/google/routemap';
      $('#routemap').attr('src',routeUrl);
    });
 });
 $('#prev').click(function(e){
    $.get('moveprev').done(function() {
      var streetViewUrl = '/google/streetview';
      $('#streetview').attr('src',streetViewUrl);  
      var routeUrl = '/google/routemap';
      $('#routemap').attr('src',routeUrl);
    });
 });
});

