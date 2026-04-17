import os
from sqlalchemy import create_engine
import psycopg2
from sqlalchemy import text
import time

# Note that if this is localhost - this will go to the container's localhost not the machines
# consider this instead of localhost:5432 do host.docker.internal:5432

DOCKER_DB_URL = os.getenv("DOCKER_DB_URL")

engine = create_engine(DOCKER_DB_URL)

def checkJobsTable(): 
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT * FROM jobs
                WHERE job_type = :job_type
                AND job_status = :job_status
                ORDER BY id
                LIMIT 1
            """),
            {"job_type": "hello_world_test", "job_status": "pending"}
        )
        return result.fetchone()

def claimJob(job_id):
    # update the job with the correct id so that its status is working
    # job_id needs to be a number
    print(f'claiming job {job_id}')
    with engine.connect() as conn:
        conn.execute(
            text("""
                UPDATE jobs
                SET job_status = 'working'
                WHERE id = :id
            """),
            {"id": job_id}
        )
        conn.commit()

def main(job_id, user_id, data):
    # do the actual operation - in bigger workers this will be more than just a main function but this one is so stupidly easy it is just a main - for the bigger ones this should just import a main and use that
    # data is currently the whole json object - could dive into / enumerate it
    # if we just did this as is it would be hackable as data is a human enterable input - maybe we just make sure its a string with no shit in it on entry? that isnt exactly secure
    print(f'doing job {job_id} for user {user_id} and the data is {data}')
    textToInsert = data['data']
    with engine.connect() as conn:
        conn.execute(
            text("""
                INSERT INTO hello_world_test (job_id, data, user_id) VALUES (:job_id, :data, :user_id)
            """),
            {'job_id': job_id, 'data': textToInsert, 'user_id':user_id}
        )
        conn.commit()

print('This image still has prints inside of it - just to know its doing stuff')

while True:
    result = checkJobsTable()
    if result != None:
        claimJob(result[0])

        main(result[0], result[3], result[4])
    print('No new job - waiting 3s')
    time.sleep(3)