import os
from sqlalchemy import create_engine
from sqlalchemy import text
# This is only for dev - for docker images this needs to be commented out
from dotenv import load_dotenv
load_dotenv()

DEV_DB_URL = os.getenv("DEV_DB_URL")
PROD_DB_URL = os.getenv("PROD_DB_URL")
isProd = os.getenv("IS_PROD") == "True"

if isProd:
    connectionString = PROD_DB_URL
else:
    connectionString = DEV_DB_URL

engine = create_engine(connectionString)
    
def checkAndClaimJob():
    with engine.begin() as conn:
        return conn.execute(
            text("""
                WITH job AS (
                    SELECT id
                    FROM jobs
                    WHERE job_type = 'map_scraper'
                    AND job_status = 'pending'
                    ORDER BY id
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                )
                UPDATE jobs
                SET job_status = 'working'
                FROM job
                WHERE jobs.id = job.id
                RETURNING jobs.*
            """)
        ).mappings().one_or_none()
    
def finishJob(job_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                UPDATE jobs
                SET job_status = 'finished'
                WHERE id = :id
                RETURNING *                              
            """),
            {"id": job_id}
        ).mappings().one()
        conn.commit()
        return result
    
def errorJob(job_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                UPDATE jobs
                SET job_status = 'error'
                WHERE id = :id
                RETURNING *                              
            """),
            {"id": job_id}
        ).mappings().one()
        conn.commit()
        return result
    
def updateJobMetadata(job_id: int, placeCount: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                UPDATE jobs
                SET data = jsonb_set(
                    COALESCE(data, '{}'::jsonb),
                    '{jobPreview,placeCount}',
                    to_jsonb(CAST(:placeCount AS integer)),
                    true
                )
                WHERE id = :id
                RETURNING *
            """),
            {
                "id": job_id,
                "placeCount": placeCount,
            }
        ).mappings().one()
        conn.commit()
        return result
    
def insertBatchIntoOvertureMapPlaces(job_id: int, items):
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO overture_maps_places (
                    job_id,
                    map_id,
                    name,
                    category,
                    basic_category,
                    confidence,
                    operating_status,
                    address,
                    postcode,
                    website,
                    phone,
                    latitude,
                    longitude
                )
                VALUES (
                    :job_id,
                    :map_id,
                    :name,
                    :category,
                    :basic_category,
                    :confidence,
                    :operating_status,
                    :address,
                    :postcode,
                    :website,
                    :phone,
                    :latitude,
                    :longitude
                )
            """),
            items
        )