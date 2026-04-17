This is going to be the new repo where I actually fix all of the problem code in my old backend - this should become much less complicated through doing so and only once I have figured out this problem will I proceed to the next stage of building a frontend


# The website backend in all of its glory

This will need a few things in order to actually work well

1. A DB - This can be done through the local db to begin with but should probably be defined as a container in here so that this can be moved around easily once the table schemas are all good
2. An API - this should interact with the db doing simple CRUD and auth - auth can go through maybe a user and pass to begin with but it should really be oauth.
3. Workers - These should pull from a jobs table in the db with their assigned tasks and then they can update tables as I see fit in the db - from this a read request from the api should query the job entry to see how the job is getting along and the respective tables to see the actual data

This should be a fairly solid infra - the main thing I don't know how to do with this is the auth - pattern wise that is the only thing I need to learn - set it up so that I can run the whole thing out of postman to begin with.

The old express project is pretty fucked but maybe we can recycle the routing - it just needs to interact with a db which will be another container

## This folder should only have other folders inside of it and maybe some docker code - No execution actually at this level