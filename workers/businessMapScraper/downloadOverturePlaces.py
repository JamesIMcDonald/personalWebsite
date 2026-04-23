# here is something using OvertureMaps - this is free and we now want to see the quality:
import duckdb
import math

# a 400m walk is 5 mins - 800 is 10 but we can walk in any direction - I know its a square but at these sizes its fine - do 1200m
# 5 min walk = 800m
# 10 min walk = 1600m
# bbox = west, south, east, north
# Example: central London-ish. Adjust this.
# use https://bboxfinder.com to make bounding boxes
# This was overture_places_central_london WEST, SOUTH, EAST, NORTH = -0.076089, 51.509973, -0.067592, 51.515234
def bbox_from_center(lat: float, lon: float, width_m: float):
    """
    Return a square bounding box around a center point.

    Args:
        lat: center latitude in decimal degrees
        lon: center longitude in decimal degrees
        width_m: total width/height of the square in metres

    Returns:
        (west, south, east, north)
    """

    earth_radius_m = 6_371_000
    half_width_m = width_m / 2

    # Latitude: metres per degree is roughly constant
    delta_lat = math.degrees(half_width_m / earth_radius_m)

    # Longitude: metres per degree shrinks with latitude
    lat_rad = math.radians(lat)
    delta_lon = math.degrees(half_width_m / (earth_radius_m * math.cos(lat_rad)))

    west = lon - delta_lon
    east = lon + delta_lon
    south = lat - delta_lat
    north = lat + delta_lat

    return west, south, east, north

def downloadOvertureMapsData(lat: float, lon: float, widthM: int):

    print(f"Downloading maps data for {lat}, {lon} in a {widthM}m box.")

    WEST, SOUTH, EAST, NORTH = bbox_from_center(lat, lon, widthM)

    con = duckdb.connect()

    # print("INSTALL spatial;")
    con.execute("INSTALL spatial;")
    # print("INSTALL httpfs;")
    con.execute("INSTALL httpfs;")
    # print("LOAD spatial;")
    con.execute("LOAD spatial;")
    # print("LOAD httpfs;")
    con.execute("LOAD httpfs;")
    con.execute("SET s3_region='us-west-2';")
    # print("Done")

    # Current Overture release path from their docs as of Apr 2026.
    # Maybe setup a checker which grabs the latest date at some point
    PLACES_PATH = "s3://overturemaps-us-west-2/release/2026-04-15.0/theme=places/type=place/*"
    # print("Running query")
    query = f"""
    SELECT
        id,
        names.primary AS name,
        categories.primary AS category,
        basic_category,
        confidence,
        operating_status,
        addresses[1].freeform AS address,
        addresses[1].postcode AS postcode,
        websites[1] AS website,
        phones[1] AS phone,
        ST_X(geometry) AS lon,
        ST_Y(geometry) AS lat
    FROM read_parquet(
        '{PLACES_PATH}',
        filename=true,
        hive_partitioning=1
    )
    WHERE
        bbox.xmin BETWEEN {WEST} AND {EAST}
        AND bbox.ymin BETWEEN {SOUTH} AND {NORTH}
        AND names.primary IS NOT NULL
        AND operating_status != 'permanently_closed'
        AND confidence >= 0.6
    """

    df = con.execute(query).df()

    print(len(df))

    return df
