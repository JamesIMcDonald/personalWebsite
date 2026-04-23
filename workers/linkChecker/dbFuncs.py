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
        result = conn.execute(
            text("""
                WITH job AS (
                    SELECT id
                    FROM jobs
                    WHERE job_type = 'link_checker'
                    AND job_status in ('pending', 'resuming')
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
        return result
    
    
def claimJob(job_id):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                UPDATE jobs
                SET job_status = 'working'
                WHERE id = :id
                RETURNING *                                
            """),
            {"id": job_id}
        ).mappings().one()
        conn.commit()
        return result
    
def finishJob(job_id):
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
    
def updateJobMetadata(job_id, crawlCount, discoverCount, linkCount):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                UPDATE jobs
                SET data = jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            data,
                            '{jobPreview,linkCount}',
                            to_jsonb(CAST(:linkCount AS integer))
                        ),
                        '{jobPreview,crawlCount}',
                        to_jsonb(CAST(:crawlCount AS integer))
                    ),
                    '{jobPreview,discoverCount}',
                    to_jsonb(CAST(:discoverCount AS integer))
                )
                WHERE id = :id
                RETURNING *
            """),
            {
                "id": job_id,
                "crawlCount": crawlCount,
                "discoverCount": discoverCount,
                "linkCount": linkCount,
            }
        ).mappings().one()

        conn.commit()
        return result

# this used to be used when I want to be able to restart a job from some middle point - not calling it for now
def getAllPagesForJob(job_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    id,
                    url,
                    CASE
                        WHEN destination_url IS NOT NULL
                         AND TRIM(destination_url) <> ''
                        THEN TRUE
                        ELSE FALSE
                    END AS checked
                FROM link_checker_pages
                WHERE job_id = :job_id
                ORDER BY id
            """),
            {"job_id": job_id}
        )

        return {row.url: (row.checked, row.id) for row in result}
    
def getCountOfJobLinks(job_id):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT COUNT(*) AS link_count
                FROM link_checker_links
                WHERE job_id = :job_id
            """),
            {"job_id": job_id}
        )
        return result.scalar()

def insertIntoLinkCheckerLinks(job_id, from_url_id, to_url_id):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                INSERT INTO link_checker_links (job_id, from_url_id, to_url_id)
                VALUES (:job_id, :from_url_id, :to_url_id)
                RETURNING *                
            """),
            {"job_id": job_id, "from_url_id": from_url_id, "to_url_id": to_url_id}
        ).mappings().one()
        conn.commit()
        return result

def insertIntoLinkCheckerPages(jobId, url):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                INSERT INTO link_checker_pages (job_id, url)
                VALUES (:job_id, :url)
                RETURNING *               
            """),
            {"job_id": jobId, "url": url}
        ).mappings().one()
        conn.commit()
        return result

def updateLinkCheckerPagesDestinationOnly(destinationUrl, id):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                UPDATE link_checker_pages
                SET fetched_at = NOW(), destination_url = :destination_url
                WHERE id = :id
                RETURNING *               
            """),
            {"destination_url": destinationUrl, "id": id}
        ).mappings().one()
        conn.commit()
        return result

# only needed once
def updateJobBaseUrl(job_id, new_base_url):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                UPDATE jobs
                SET data = jsonb_set(
                    data,
                    '{baseUrl}',
                    to_jsonb(CAST(:new_base_url AS text)),
                    true
                )
                WHERE id = :job_id
                RETURNING *
            """),
            {
                "job_id": job_id,
                "new_base_url": new_base_url,
            }
        ).mappings().one()
        conn.commit()
        return result

def updateLinkCheckerPagesMAINUrl(id, newMainUrl):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                UPDATE link_checker_pages
                SET fetched_at = NOW(), url = :newMainUrl
                WHERE id = :id
                RETURNING *               
            """),
            {"newMainUrl": newMainUrl, "id": id}
        ).mappings().one()
        conn.commit()
        return result