R = 6371.0
    
toRad = (deg) -> deg * (Math.PI / 180.0)
toDeg = (rad) -> rad / (Math.PI / 180.0)

@offsetHeading = (brng, hdgOff) -> ((brng + hdgOff) + 360.0) % 360.0
        
@getHeading = (start, end) ->
    dlon = toRad (end.lng - start.lng)
    lat1 = toRad start.lat
    lat2 = toRad end.lat

    x = Math.sin(dlon) * Math.cos(lat2)
    y = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlon)
    (toDeg(Math.atan2(x, y)) + 360.0) % 360.0

@getDistance = (start, end) ->
    dlat = toRad (end.lat - start.lat)
    dlon = toRad (end.lng - start.lng)
    lat1 = toRad start.lat
    lat2 = toRad end.lat

    a = Math.sin(dlat / 2.0) * Math.sin(dlat / 2.0) +
        Math.sin(dlon / 2.0) * Math.sin(dlon / 2.0) *
        Math.cos(lat1) * Math.cos(lat2)
    c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a))
    (R * c)
