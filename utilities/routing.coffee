geometry = require "./geometry"

decode = (polyStr) ->
    index = 0;
    len = polyStr.length;
    lat = 0;
    lng = 0;
    
    pointsList = [];

    while index < len
        b = 0
        shift = 0
        result = 0

        b = polyStr.charCodeAt(index) - 63
        index++
        result |= (b & 0x1f) << shift
        shift += 5
        while (b >= 0x20)
            b = polyStr.charCodeAt(index) - 63
            index++
            result |= (b & 0x1f) << shift
            shift += 5
        dlat = if (result & 1) != 0 then ~(result >> 1) else (result >> 1)
        lat += dlat

        shift = 0
        result = 0
        b = polyStr.charCodeAt(index) - 63
        index++
        result |= (b & 0x1f) << shift
        shift += 5
        while (b >= 0x20)
            b = polyStr.charCodeAt(index) - 63
            index++
            result |= (b & 0x1f) << shift
            shift += 5
        dlng = if (result & 1) != 0 then ~(result >> 1) else (result >> 1)
        lng += dlng

        pointsList.push(( lat: lat / 1e5, lng: lng / 1e5 ))
    pointsList

startRoute = () -> []

addRouteSegment = (polyline) ->
    route = []
    pointsList = decode(polyline)
    console.log "Found #{pointsList.length} points in #{polyline}"
    for start,i in pointsList
        unless i >= pointsList.length - 1
            end = pointsList[i+1] 
            heading = geometry.getHeading start, end
            distance = geometry.getDistance start, end
            route.push (start: start, end: end, heading: heading, distance: distance)
    route

makeObs = (location, heading) -> (location: location, forwardHeading: heading)

calculateObservationPoints = (fullRoute, legDistance) ->
    obsPointsList = []
    currentLegDistance = legDistance+1
    
    for position in fullRoute
        if currentLegDistance > legDistance
            currentLegDistance = 0
            obsPointsList.push makeObs(position.start, position.heading)
        else currentLegDistance += position.distance
    obsPointsList

@parseRoute = (routeJson) ->
    routeLegs = startRoute()
    
    for leg in routeJson.routes[0].legs
        if leg.steps? 
            for step in leg.steps
                if (step.polyline? && step.polyline.points?) 
                    section = addRouteSegment step.polyline.points
                    routeLegs = routeLegs.concat section

    console.log routeLegs.length
    obsPointsList = calculateObservationPoints routeLegs, 0.01
    obsPointsList
