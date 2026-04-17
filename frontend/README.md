# My Personal Website

This is the next frontend which should serve as a UI to my backend

## Here is my current plan for the structure:

- / - A homepage with a bit about me and a bit about the tools I've made and why
- /about - This will effectively be my CV with some flair
- /tools - This will be a complete overview of every project I load up into this thing
- /tools/xyz - This will be a detail page explaining it, what it can do etc and then at the bottom you can see all of your jobs with the tool if logged in - if not it'll just say login
- /projects - This will explain the engineering behind each project I choose - static page which should be v nice
- /jobs - This will be a master list of all jobs for a user - will only show up in the header when logged-in and will have a 2 stage form - stage 1 - pick tool then it renders the form for that tool. 
- /jobs/\[jobId\] - This will be the detail page for a specific job - it will first grab the job from the DB - lookup the job_type in the registry and then render the component for the corresponding job - this means that it will be able to handle all job_types from one page - I do unfortunately still have to design each page
- /login - the place for those people to login - Swaps for logout in the header when logged-in


## General next steps:

1. Decide where to actually start building this beast haha - Could try to make a static page or the tools stuff
2. I probably want to tackle the tools stuff first - learn how to properly run this registry stuff and build out the corresponding components
3. Look for inspiration on how I want my homepage to be built and then run from there