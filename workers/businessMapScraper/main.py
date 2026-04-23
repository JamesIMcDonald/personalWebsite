from downloadOverturePlaces import downloadOvertureMapsData
import pandas as pd
from typing import Any
import time
from dbFuncs import (
    checkAndClaimJob,
    finishJob,
    errorJob,
    updateJobMetadata,
    insertBatchIntoOvertureMapPlaces,
)



# job = [0, 'map_scraper', 'pending', 1, {"latitude": 51.512245, "longitude": -0.0695925, "width": 30}]

def clean(value: Any):
    if pd.isna(value):
        return None
    return value

def main(job):

    jobId = job["id"]
    latitude = job["data"]["latitude"]
    longitude = job["data"]["longitude"]
    width = job["data"]["width"]

    try:
        data = downloadOvertureMapsData(latitude, longitude, width)
    
        if not data.empty:
            dataList = [
                    {
                        "job_id": jobId,
                        "map_id": clean(row["id"]),
                        "name": clean(row["name"]),
                        "category": clean(row["category"]),
                        "basic_category": clean(row["basic_category"]),
                        "confidence": clean(row["confidence"]),
                        "operating_status": clean(row["operating_status"]) or "unknown",
                        "address": clean(row["address"]),
                        "postcode": clean(row["postcode"]),
                        "website": clean(row["website"]),
                        "phone": clean(row["phone"]),
                        "latitude": clean(row["lat"]),
                        "longitude": clean(row["lon"]),
                    }
                    for _, row in data.iterrows()
                ]
            insertBatchIntoOvertureMapPlaces(jobId, dataList)
            updateJobMetadata(jobId, len(dataList))
        else:
            updateJobMetadata(jobId, 0)

        data.to_csv(f"overture_places_exponential-e_test_{latitude}_{longitude}.csv", index=False)

        finishJob(jobId)
            
            
    except Exception as e:
        print(f"Job {jobId} failed: {e}")
        errorJob(jobId)
        return False

# setup a loop here
while True:
    job = checkAndClaimJob()

    if job is not None:
        print(job)
        print(f'Found job {job["id"]}: {job["data"]["latitude"]}, {job["data"]["longitude"]}, {job["data"]["width"]}m')

        main(job)
        print(f'Finished job {job["id"]}: {job["data"]["latitude"]}, {job["data"]["longitude"]}, {job["data"]["width"]}m')

    time.sleep(5)