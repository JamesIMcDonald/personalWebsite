# The backend API for my personal website

This bad boy is going to handle the backend functionality for my website - this consists of a few main things:

## Communication with the DB

This is the main thing which this will facilitate the website retrieving data from the DB I'll probably run this as a part of the same VM or in the same provider as the next website so that I can take advantage of private networking otherwise making this thing safe will be a massive pain

## Orchestrating the workers for other tasks

This is probably the only other thing this is going to do haha, it'll set workers to actually do the jobs that it will then retrieve from the DB

SO - the loop will look like this:

1. Request from website for Job - this will be a request url and it should just supply their JWT and some payload with relevant details for the job
2. Check their auth - are they allowed to request this job?
3. If yes then load it into the DB and let the workers do their thing
4. Now the person can hit some urls i.e. POST jamesmcdonald.co.uk/websitelinkchecker/start or GET jamesmcdonald.co.uk/websitelinkchecker/{JOB_ID} they can start jobs or recieve info - remember the MVC format - the Library is a good example
5. When figuring out URL structure try to mirror it around the DB structure i.e. different tools at the top and different jobs off of that - CRUD
6. Maybe just get the thing to look like its loading and just ping every once in a while

## NEW TODOs:

- THE FULL OBJECTIVE IS TO HAVE AN API I CAN PUPPETEER FROM POSTMAN WHICH I CAN THEN MAKE A WEBSITE FOR
1. Get basic hello world routes sorted
2. DECIDE 1st OBJECTIVE - load broken link checker into this
- Will need db architecture
- Will need to get prisma into the API for writes to the JOB table and reads from the table that the output of that job writes to
- Want to containerise the program even though I could just import the function for now
- Adapt program to instead work out of the central DB - need to see how .envs are fed around





## OLD TODOs:

1. Get prisma loaded up and get a connection to the DB setup with some test data
2. Get auth setup using JWT's
- Getting the auth working - we need two tables added to the db - federated_credentials and users
- users is simple it'll have all of the standard user details - email, username, password and whatever the hell else I want (True/False access to tools probably)
- users fields: id, username, email (later we can add password and other stuff but for now we will only be using google oauth and maybe facebook)
- federated_credentials fields: id, user_id, provider, subject (This is basically all I need on this end - an entry here and an entry in the users table should be made simultaneously)
- for the Google emails problem just store the first verified one - this will probably be a google one but can be a custom domain and it doesn't matter
- TODO: Standard user insertion - https://github.com/passport/todos-express-facebook/blob/master/routes/auth.js is a good example or maybe some of my own repos - once a user is inserted create a JWT and give that to the client maybe? or see how this google auth works?
- Basically I'm confused because I think I need to use 2 strategies to make sure my db is airtight - the google strategy so I don't have to store passwords and then a jwt strategy to give to the user so we can verify afterwards