var modemap = function() {

    var get_query_content = function(query_name) {
        return datasets.filter(function(d) {
            return d.queryName == query_name;
        })[0].content
    }

    var init_map = function(map_id, center, default_zoom) {
        var m = L.map(map_id).setView(center, default_zoom)
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(m)
        return m
    }


    // geohash.js
    // Geohash library for Javascript
    // (c) 2008 David Troy
    // Distributed under the MIT License
    // Modified from https://github.com/davetroy/geohash-js

    var BITS        = [16, 8, 4, 2, 1],
        BASE32      = "0123456789bcdefghjkmnpqrstuvwxyz",
        NEIGHBORS   = { right  : { even :  "bc01fg45238967deuvhjyznpkmstqrwx" },
            left   : { even :  "238967debc01fg45kmstqrwxuvhjyznp" },
            top    : { even :  "p0r21436x8zb9dcf5h7kjnmqesgutwvy" },
            bottom : { even :  "14365h7k9dcfesgujnmqp0r2twvyx8zb" }
        },
        BORDERS     = { right  : { even : "bcfguvyz" },
            left   : { even : "0145hjnp" },
            top    : { even : "prxz" },
            bottom : { even : "028b" }
        }

    NEIGHBORS.bottom.odd = NEIGHBORS.left.even;
    NEIGHBORS.top.odd = NEIGHBORS.right.even;
    NEIGHBORS.left.odd = NEIGHBORS.bottom.even;
    NEIGHBORS.right.odd = NEIGHBORS.top.even;

    BORDERS.bottom.odd = BORDERS.left.even;
    BORDERS.top.odd = BORDERS.right.even;
    BORDERS.left.odd = BORDERS.bottom.even;
    BORDERS.right.odd = BORDERS.top.even;

    var refine_interval = function(interval, cd, mask) {
        if (cd & mask)
            interval[0] = (interval[0] + interval[1])/2;
        else
            interval[1] = (interval[0] + interval[1])/2;
    }

    var decode = function(geohash) {
        var is_even = 1;
        var lat = []; var lon = [];
        lat[0] = -90.0;  lat[1] = 90.0;
        lon[0] = -180.0; lon[1] = 180.0;
        lat_err = 90.0;  lon_err = 180.0;

        for (i=0; i<geohash.length; i++) {
            c = geohash[i];
            cd = BASE32.indexOf(c);
            for (j=0; j<5; j++) {
                mask = BITS[j];
                if (is_even) {
                    lon_err /= 2;
                    refine_interval(lon, cd, mask);
                } else {
                    lat_err /= 2;
                    refine_interval(lat, cd, mask);
                }
                is_even = !is_even;
            }
        }
        lat[2] = (lat[0] + lat[1])/2;
        lon[2] = (lon[0] + lon[1])/2;

        return { lat: lat[2], lng: lon[2], corners: [[lat[1], lon[0]], [lat[0], lon[1]]]};
    }

    var encode = function(latitude, longitude) {
        var is_even=1;
        var i=0;
        var lat = []; var lon = [];
        var bit=0;
        var ch=0;
        var precision = 12;
        geohash = "";

        lat[0] = -90.0;  lat[1] = 90.0;
        lon[0] = -180.0; lon[1] = 180.0;

        while (geohash.length < precision) {
            if (is_even) {
                mid = (lon[0] + lon[1]) / 2;
                if (longitude > mid) {
                    ch |= BITS[bit];
                    lon[0] = mid;
                } else
                    lon[1] = mid;
            } else {
                mid = (lat[0] + lat[1]) / 2;
                if (latitude > mid) {
                    ch |= BITS[bit];
                    lat[0] = mid;
                } else
                    lat[1] = mid;
            }

            is_even = !is_even;
            if (bit < 4)
                bit++;
            else {
                geohash += BASE32[ch];
                bit = 0;
                ch = 0;
            }
        }
        return geohash;
    }

    // v in colormaps is an int between 0 and 255 (inclusive)
    var colormaps = {
        jet: {
            r: function(v) {
                var r = Math.min(255, 4*(v-96), 255-4*(v-224))
                return r < 0 ? 0 : r
            },
            g: function(v) {
                var g = Math.min(255, 4*(v-32), 255-4*(v-160))
                return g < 0 ? 0 : g
            },
            b: function(v) {
                var b = Math.min(255, 4*v+127, 255-4*(v-96));
                return b < 0 ? 0 : b
            },
        }
    }

    var component_to_hex = function(c) {
        var hex = c.toString(16)
        return hex.length == 1 ? "0" + hex : hex
    }
    var rgb_to_hex = function(r, g, b) {
        return "#" + component_to_hex(r) + component_to_hex(g) + component_to_hex(b)
    }

    var colormap_to_hex_vals = function(colormap, min_val, max_val) {
        var hex_vals = []
        for (var i=0; i<256; i++) {
            hex_vals.push(rgb_to_hex(colormap.r(i), colormap.g(i), colormap.b(i)))
        }
        return hex_vals
    }

    var val_to_index = function(min_val, max_val, val) {
        if (val >= max_val) {
            return 255
        }
        if (val <= min_val) {
            return 0
        }
        return Math.floor(256*(val - min_val)/(max_val-min_val))
    }

    var colormap_to_color_fun = function(colormap, min_val, max_val, val_col) {
        var hex_vals = colormap_to_hex_vals(colormap, min_val, max_val)
        return function(row) {
            return hex_vals[val_to_index(min_val, max_val, row[val_col])]
        }
    }

    var color_fun_factory = function(colormap_name, min_val, max_val, val_col) {
        return colormap_to_color_fun(colormaps[colormap_name], min_val, max_val, val_col)
    }

    var plot_any = function(m, content, row_to_elem) {
        for (row of content) {
            row_to_elem(row).addTo(m)
        }
        return m
    }

    var plot_pts = function(map_id, center, default_zoom, query_name, lat_col, lng_col, rad_fun=null, color_fun=null, m=null) {

        if (m == null) {
            var m = init_map(map_id, center, default_zoom)
        }

        var content = get_query_content(query_name)

        var row_to_elem = function(row) {
            return L.circleMarker(
                [row[lat_col], row[lng_col]],
                {
                    radius: rad_fun ? rad_fun(row) : 5,
                    weight: 1,
                    color: "#000000",
                    opacity: 1,
                    fillOpacity: 0.5,
                    fillColor: color_fun ? color_fun(row) : '#FF0000'
                }
            )
        }

        return plot_any(m, content, row_to_elem)
    }

    var plot_ghs = function(map_id, center, default_zoom, query_name, gh_col, val_col, color_fun=null, opacity=null, m=null) {

        if (m == null) {
            var m = init_map(map_id, center, default_zoom)
        }

        var content = get_query_content(query_name)

        var row_to_elem = function(row) {
            var elem = L.rectangle(
                decode(row[gh_col]).corners,
                {
                    weight: 0,
                    color: '#000000',
                    fillOpacity: opacity || 0.5,
                    fillColor: color_fun ? color_fun(row) : "#FF0000",
                }
            )

            elem.bindPopup(row[gh_col] + ': ' + String(row[val_col]))

            return elem
        }

        return plot_any(m, content, row_to_elem)

    }

    var plot_geojsons = function(map_id, center, default_zoom, query_name, geojson_col, val_col, color_fun=null, opacity=null, m=null) {

        if (m == null) {
            var m = init_map(map_id, center, default_zoom)
        }

        var content = get_query_content(query_name)

        var row_to_elem = function(row) {
            elem = L.geoJSON(
                [JSON.parse(row[geojson_col])],
                {
                    weight: 1,
                    color: '#000000',
                    fillOpacity: opacity || 0.5,
                    fillColor: color_fun ? color_fun(row) : '#FF0000'
                }
            )

            elem.bindPopup('value: ' + String(row[val_col]))

            return elem
        }

        return plot_any(m, content, row_to_elem)
    }

    return {
        get_query_content: get_query_content,
        init_map: init_map,
        plot: {
            any: plot_any,
            pts: plot_pts,
            ghs: plot_ghs,
            geojsons: plot_geojsons,
        },
        geohash: {
            decode: decode,
            encode: encode,
        },
        color_fun_factory: color_fun_factory,
    }

}()
