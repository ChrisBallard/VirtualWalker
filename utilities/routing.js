(function (routing) {
    var geometry = require("./geometry");
    
    var decode = function(polyStr) {
        var index = 0;
        var len = polyStr.length;
        var lat = 0;
        var lng = 0;
        
        var pointsList = [];

        while (index < len)
        {
            var b;
            var shift = 0;
            var result = 0;

            do
            {
                b = polyStr.charCodeAt(index) - 63;
                index++;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do
            {
                b = polyStr.charCodeAt(index) - 63;
                index++;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            pointsList.push({ lat: lat / 1E5, lng: lng / 1E5 });
        }
        return pointsList;
    };
    
    var startRoute = function() {
        return [];
    };
    
    var addRouteSegment = function(polyline, routeSoFar) {
        var pointsList = decode(polyline);
        for(var i = 0; i < pointsList.length - 1; i++)
        {
            var start = pointsList[i];
            var end = pointsList[i+1];
            var heading = geometry.getHeading(start, end);
            var distance = geometry.getDistance(start, end);
            routeSoFar.push({ start: start, end: end, heading: heading, distance: distance});
        }
        return routeSoFar;
    };

    var makeObs = function(location, heading) {
        return  { location: location, forwardHeading: heading };
    };
    
    var calculateObservationPoints = function(fullRoute, legDistance) {
        var obsPointsList = [];
        var currentLegDistance = legDistance+1;
        
        for(var i = 0; i < fullRoute.length; i++)
        {
            if(currentLegDistance > legDistance)
            {
                currentLegDistance = 0;
                obsPointsList.push(makeObs(fullRoute[i].start, fullRoute[i].heading));
            }
            else
            {
                currentLegDistance += fullRoute[i].distance;
            }
        }
        return obsPointsList;
    };
    
    routing.parseRoute = function(routeJson) {
        var routeLegs = startRoute();
        
        routeJson.routes[0].legs.forEach(function(leg) {
            if( leg.steps ) {
                leg.steps.forEach(function(step) {
                    if( step.polyline && step.polyline.points ) {
                        routeLegs = addRouteSegment(step.polyline.points, routeLegs);
                    }
                });
            }
        });
        
        var obsPointsList = calculateObservationPoints(routeLegs, 0.5);
        return obsPointsList;
    };
        
})(module.exports);