# dd-modemap
Create map plots in mode at DoorDash

## Context
These tools allow anyone to write queries containing geospatial information and plot them within a Mode report. Although there are advanced features within these tools, the most common and useful functionalities can be utilized without any programming/Javascript knowledge. PM's welcome! 

All examples in this README can be found [here](https://app.mode.com/editor/doordash/reports/dc0e0e49682e/presentation). 

## Background
In the Mode editor, go to 'Report Builder', then to 'Edit HTML' or the `</>` symbol. Here you can add custom HTML, CSS, and Javascript to your dashboard. A global variable called ```datasets``` is available to any Javascript function, and it contains the results of all your queries. How your results are stored in this data structure is not important, as the functions in this repo abstract that away. 

## Step 1: Write a Query
Write a query that contains geospatial information. Some examples are 'lat' and 'lng' columns, 'geohash' and 'value' columns, or `geojson` and `value` columns. However, any geospatial information that can be handled by [Leaflet](https://leafletjs.com/) are plottable. 

## Step 2: Get Leaflet and Mode-Mapping into Your Mode Workspace
Go to 'Report Builder' --> 'Edit HTML' (or the '</<>' symbol). At the top of the page, cut and paste the following code:

```
<link rel="stylesheet" href="https://npmcdn.com/leaflet@1.0.0-rc.3/dist/leaflet.css">
<script src="https://npmcdn.com/leaflet@1.0.0-rc.3/dist/leaflet.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/timmysiauw/dd-modemap@master/modemap.css"></script>
<script src="https://cdn.jsdelivr.net/gh/timmysiauw/dd-modemap@master/modemap.js"></script>
```

## Step 3: Setup a Map in Report Builder 
Underneath the section that looks like 

```
<div class="mode-header embed-hidden">
  <h1>{{ title }}</h1>
  <p>{{ description }}</p>
</div>
```

Create a `div` that looks like 

```
<div class="mode-grid container">
  <div class="row">
    <div class="col-md-12">
      <div id="unique-id" class="map">
        <script>
          // Plotting code will go here.
        </script>
      </div>
    </div>
  </div>
</div>
```

The id `"unique-id"` can be any string, but only one `div` can have this name in your report. 

Note that subsequent plots can be placed within the existing `<div class="mode-grid container"></div>`.

## Step 4: Insert Your Plot

### Plotting Points 

For plotting points, i.e., lat/lng pairs, use `modemap.plot.pts`. The functions signature is 

```modemap.plot.pts(map_id, center, default_zoom, query_name, lat_col, lng_col, rad_fun=null, color_fun=null, m=null)``` 

The inputs are
  * `map_id` is a string matching the `"unique-id"` of the div associated with this map
  * `center` is an array `[lat, lng]` denoting the default center of the map when it is plotted
  * `default_zoom` is an int denoting the default zoom of the map when it is plotted
  * `query_name` is a string matching the Mode query name where data should be pulled from
  * `lat_col` is a string containing the name of the column that should be used for latitude 
  * `lng_col` is a string containing the name of the column that should be used for longitude
  * `radius_fun` [optional] is a function that controls the size each individual point is plotted. See Radius Functions section  
  * `color_fun` [optional] is a function that controls the color each individual point is plotted. See Color Functions section 
  * `m` [optional] is a map object that the current plot should be added to. Multiple calls to different plotting functions can create more complex maps. 
  
The output is a map object. 

#### Example 1: Simple Plot 

Between the `<script>` and `</script>` tags, insert 
  
```
modemap.plot.pts('example-1', [37.7338312, -122.417149], 10, '1. store locations', 'PICKUP_LAT', 'PICKUP_LNG', null, null, null)
```

Note here that `'example-1'` matches the `id` for the `div` containing this map. 

#### Example 2: Using Radius and Color Functions 

Create another map `div` with a new `id`, and between the `<script>` and `</script>` tags, insert 

```
var rf = function(row) {
  return Math.ceil(row['NUM_DELIVERIES'] / 200)
}

var cf = function(row) {
  if (row['NUM_DELIVERIES'] < 1000) {
    return '#0000FF' // blue
  } else {
    return '#FF0000' // red
  }
}

modemap.plot.pts('example-2', [37.7338312, -122.417149], 10, '1. store locations', 'PICKUP_LAT', 'PICKUP_LNG', rf, cf, null)
```

Here, `rf` is a radius function that scales the size of the point proportionately to the number of deliveries from that store. Similarly `cf` is a color function that plots the point in blue if the number of deliveries from that store is less than 1000 and red otherwise. You can read more about radius and color functions in their respective sections in [Advanced Usage](https://github.com/timmysiauw/dd-modemap/edit/main/README.md#advanced-usage). 

### Plotting Geohashes 

For plotting geohashes, use `modemap.plot.ghs`. The functions signature is 

```modemap.plot.ghs(map_id, center, default_zoom, query_name, gh_col, val_col, color_fun=null, opacity=null, m=null)``` 

The inputs are
  * `map_id` is a string matching the `"unique-id"` of the div associated with this map
  * `center` is an array `[lat, lng]` denoting the default center of the map when it is plotted
  * `default_zoom` is an int denoting the default zoom of the map when it is plotted
  * `query_name` is a string matching the Mode query name where data should be pulled from
  * `gh_col` is a string denoting the name of the column that identifies geohashes
  * `val_col` is a string denoting the value associated with that geohash
  * `color_fun` [optional] is a function that controls the color each individual geohash is plotted with. See Color Functions section 
  * `m` [optional] is a map object that the current plot should be added to. Multiple calls to different plotting functions can create more complex maps. 
  
The output is a map object. 

Note that each geohash is clickable, which shows a popup of the geohash name and value. 

#### Example 3: Geohashes 

Between the `<script>` and `</script>` tags, insert 
  
```
modemap.plot.ghs('example-3', [37.7338312, -122.417149], 10, '2. geohashes', 'GH', 'VAL', null, null, null)
```

TODO: Get a better geohash example query. 

### Plotting GeoJSONS

For plotting geohashes, use `modemap.plot.geojsons`. The functions signature is 

```modemap.plot.geojsons(map_id, center, default_zoom, query_name, geojson_col, val_col, color_fun=null, opacity=null, m=null)``` 

The inputs are
  * `map_id` is a string matching the `"unique-id"` of the div associated with this map
  * `center` is an array `[lat, lng]` denoting the default center of the map when it is plotted
  * `default_zoom` is an int denoting the default zoom of the map when it is plotted
  * `query_name` is a string matching the Mode query name where data should be pulled from
  * `geojson_col` is a string denoting the name of the column that identifies geojsons
  * `val_col` is a string denoting the value associated with that geojson
  * `color_fun` [optional] is a function that controls the color each individual geojson is plotted with. See Color Functions section 
  * `m` [optional] is a map object that the current plot should be added to. Multiple calls to different plotting functions can create more complex maps. 
  
The output is a map object. 

Note that each geojson is clickable, which shows a popup of the geojson value. 

### Example 4: Geojsons with JET color scheme 

Between the `<script>` and `</script>` tags, insert 
  
```
var cf = modemap.color_fun_factory('jet', 0, 50000, 'DELIVERY_CNT')
modemap.plot.geojsons('example-4', [37.7338312, -122.417149], 7, '3. geojsons', 'GEOJSON', 'DELIVERY_CNT', cf, null, null)
```

The resulting plot shows all the starting points in the DoorDash ecosystem colored according to the [Jet](http://matlab.izmiran.ru/help/techdoc/ref/colormap.html) colormap by how many deliveries occurred in a one week period, blue = 0, red = 50000+. 

## Advanced Usage 

### Generic Plotting Function 

`plot.pts`, `plot.ghs`, `plot.geojsons` are all wrappers around the `plot.any` function, which is a generic and flexible function for plotting any geospatial data that can be handled by Leaflet. 

The signature of the function is 

```

```


### Radius Functions 
Color and radius functions let you size/color points or color geohashes dynamically based on your SQL results. 


### Color Functions
There are a few color function generators already built in to ```modemap```. More to come!

1. ```modemap.color.fun.constant(color)```: takes a color (hex string) and returns a function that will return that color for all plot markers. 
2. ```modemap.color.fun.jet(val_col, min_val, max_val)```: takes the name of a value column in your query results, ```val_col``` and returns a function that will return a color according to [JET](http://matlab.izmiran.ru/help/techdoc/ref/colormap.html) linear color scheme. Values less than ```min_val``` will be assigned the lowest color value (blue) and values higher than ```max_val``` will be assigned the highest color value (red). 

#### Built in colormaps 


### Default Center and Default Zoom

### Map Titles 

### Handling Geohashes 

## Troubleshooting
* If you have any unrun queries in your list of queries, then no maps will show up, i.e., you will get a Javascript error.
* If you change the name of the query, you have to run the query for the name change to be registered in the Report Builder. 
* Your query result must be less than 15MB or none of these tools will work. In this case, the results are stored in a .csv file instead of a JSON are not accessible from the Report Builder workspace. 

## Notes:
You can't CDN out of a private repo (like DoorDash's) so this comes out of my personal github account. There is no DoorDash-specific information in this code.
