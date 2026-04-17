This is going to be a super fucking simple worker

It needs to:

Take in a DB url from an ENV variable

Connect to that db and refresh every 3s looking for a helloWorld job and then inside of the hello_world table I want it to write the message from data in as an entry with a reference to the job id and a timestamp

The challenge here is all of the docker bs - how do I make it pull in an env variable and how do I build a fucking image

If I can build this I can build anything that I want within this architecture

Actually no I will want things to connect to the internet 

And deploying into the cloud but those can be done later
