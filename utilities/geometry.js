(function (geometry) {
    var R = 6371.0;
    
    var toRad = function(deg) {
        return deg * (Math.PI / 180.0);
    };

    var toDeg = function(rad) {
        return rad / (Math.PI / 180.0);
    };

    var offsetHeading = function(brng, hdgOff) {
        return ((brng + hdgOff) + 360.0) % 360.0;
    };
        
    geometry.getHeading = function(start, end) {
        var dlon = toRad(end.lng - start.lng);
        var lat1 = toRad(start.lat);
        var lat2 = toRad(end.lat);

        var x = Math.sin(dlon) * Math.cos(lat2);
        var y = Math.cos(lat1) * Math.sin(lat2) -
                Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlon);
        return (toDeg(Math.atan2(x, y)) + 360.0) % 360.0;
    };
    
    geometry.getDistance = function(start, end) {
        var dlat = toRad(end.lat - start.lat);
        var dlon = toRad(end.lng - start.lng);
        var lat1 = toRad(start.lat);
        var lat2 = toRad(end.lat);

        var a = Math.sin(dlat / 2.0) * Math.sin(dlat / 2.0) +
                Math.sin(dlon / 2.0) * Math.sin(dlon / 2.0) *
                Math.cos(lat1) * Math.cos(lat2);
        var c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        var d = R * c;
        return d;
    };
    
    
})(module.exports);