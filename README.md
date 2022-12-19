# dd-modemap
Create map plots in mode at DoorDash

## Context
In the Mode editor, go to 'Report Builder', then to 'Edit HTML' or the `</>` symbol. Here you can add custom HTML, CSS, and javascript to your dashboard. A global variable called ```datasets``` is available to any Javascript function, and it contains the results of all your queries. How your results are stored in this data structure is not important, as the functions in this repo abstract that away. However, be aware that if your results take up more than 15MB of space, then this object will point to a .csv file instead of as a JSON, and none of these tools will work. 

All examples in this README can be found [here](https://app.mode.com/editor/doordash/reports/dc0e0e49682e/presentation). 

## Step 1: Write a Query
Write a query that contains geospatial information. Some examples are 'lat' and 'lng' columns, 'geohash' and 'value' columns, or a geojson and value columns. However, any geospatial information that can be handled by [Leaflet](https://leafletjs.com/) are plottable. 

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
modemap.plot.pts('test-points', [37.7338312, -122.417149], 10, '1. delivery locations', 'PICKUP_LAT', 'PICKUP_LNG', null, null, null)
```

Note here that `'test-points'` matches the `"unique-id"` for the `div` containing this map. 

#### Example 2: 

  
  A function controlling the radius of plotted point. It should look like ```radius_fun(content, idx)```, where content is the table associated with `query_name` and `idx` is the index in ```content``` currently being plotted. Note you can call on any column in ```content``` to determine the radius. If ```radius_fun = null``` then the radius is 2px.
  * ```color_fun``` A function controlling the color of plotted point. It should look like ```color_fun(content, idx)```, where content is the table associated with ```query_name``` and ```idx``` is the index in ```content``` currently being plotted. Note you can call on any column in ```content``` to determine the color. If ```color_fun = null``` then the color is red.

#### Example:
```
<div id="test-pts" class="map">
  <script>
    modemap.plot.pts("test-pts", [37.7764386, -122.3947219], 10, "Query 1", "passenger_lat", "passenger_lng", null, null) 
  </script>
</div>
```

For plotting geohashes, use ```modemap.plot.ghs(map_id, center, default_zoom, query_name, gh_col, val_col, color_fun)```:

The (new) inputs are
  * ```gh_col``` The name of the column that should be used for plotting geohashes
  * ```val_col``` The value to be associated with the geohash (usually for coloring)
  * ```color_fun``` A function controlling the color of plotted point. It should look like ```color_fun(content, idx)```, where content is table associated with ```query_name``` and ```idx``` is the index in ```content``` currently being plotted. Note you can call on any column in ```content``` to determine the color. If ```null``` then the color is red.

#### Example:
```
<div id="test-ghs-2" class="map">
  <script>
    modemap.plot.ghs("test-ghs-2", [37.7764386, -122.3947219], 10, "Query 2", "gh6", "num_requests", cf) 
  </script>
</div>
```

For plotting geohashes with a week hour slider, use ```modemap.plot.ghs_w_wkhr_slider(map_id, center, default_zoom, query_name, gh_col, val_col, wkhr_col, color_fun)```:

The (new) input are
 * ```wkhr_col``` The name of the column that should be used for the week hour. 
 
#### Example:
```
<div id="test-ghs-3" class="map">
  <script>
    var cf = modemap.color.fun.jet("req_cnt", 1, 20)
    modemap.plot.ghs_w_wkhr_slider("test-ghs-3", [37.7764386, -122.3947219], 10, "Query 3", "gh6", "req_cnt", "wkhr", cf)
</script>
```

###Geohashes:
You can use ```LEFT(f_geohash_encode(lat, lng), 6) AS gh6``` in SQL to get a column of geohash 6's from columns ```lat``` and ```lng```. 

You can use ```modemap.geohash.encode(lat, lng)``` and ```modemap.geohash.decode(gh)``` in Javascript to encode and decode geohashes. The ```decode``` function returns an object with properties ```lat```, ```lng```, and ```corners```. Here ```corners``` is the top-left and bottom-right corners of the geohash in the form required by Leaflet to make [rectangles](http://leafletjs.com/reference-1.0.0.html#rectangle). 


## Advanced Usage 

### Generic Plotting Function 


### Radius Functions 
Color and radius functions let you size/color points or color geohashes dynamically based on your SQL results. 


### Color Functions
There are a few color function generators already built in to ```modemap```. More to come!

1. ```modemap.color.fun.constant(color)```: takes a color (hex string) and returns a function that will return that color for all plot markers. 
2. ```modemap.color.fun.jet(val_col, min_val, max_val)```: takes the name of a value column in your query results, ```val_col``` and returns a function that will return a color according to [JET](http://matlab.izmiran.ru/help/techdoc/ref/colormap.html) linear color scheme. Values less than ```min_val``` will be assigned the lowest color value (blue) and values higher than ```max_val``` will be assigned the highest color value (red). 

#### Built in colormaps 


### Default Center and Default Zoom

### Map Titles 



## Troubleshooting
* If you have any unrun queries in your list of queries, then no maps will show up, i.e., you will get a Javascript error.
* If you change the name of the query, you have to run the query for the name change to be registered in the Report Builder. 

## Notes:
You can't CDN out of a private repo (like DoorDash's) so this comes out of my personal github account. There is no DoorDash-specific information in this code.
