# CrunchyLearn

**How To Run the file:**

1. git clone git@github.com:CodeYimin/CrunchyLearn.git
2. cd client
3. Inside the client subdirectory, npm install
4. cd into the server subdirectory
5. Inside the server directory, if you are on Windows, do npm install. Inside the server directory, if you are on Mac, do sudo npm install -unsafe--perms
6. Inside the server subdirectory, create a .env file. The .env file inside the server directory should have three variables: DATABASE_URL = "file:./dev.db", HUGGING_FACE_KEY, GCLOUD_KEY. For HUGGING_FACE_KEY and GCLOUD_KEY, create your own api keys on Huggingface and google cloud respectively.
7. Run a docker instance on port 4444 following instructions at https://github.com/ghoshRitesh12/aniwatch-api or replace all instances of `http://localhost:4444` with `https://api-aniwatch.onrender.com` in client.
8. Open a terminal and go into the server subdirectory, and run npm start
9. Open a new terminal and go into client subdirectory, and run npm start
 
**Inspiration:**

Did you know that Japanese is considered one of the most challenging languages to learn? Yet, with the rise of anime’s popularity worldwide, interest in Japanese culture and language has never been higher. Despite this, existing language learning apps fall short in truly immersing users in the intricacies of the Japanese language and culture, leading to frustration and limited progress.

So, in order to help Japanese language learners naturally immerse themselves, we have developed a novel language learning web app that leverages the power of anime to provide an engaging learning experience. On our web app, users will translate curated anime clips that will not only entertain but will also allow them to absorb language and cultural nuances in a fun and effective manner. Using tools from Google Cloud and Huggingface, our app will evaluate translations and provide accurate feedback that gives tangible progress towards fluency. Say goodbye to passive learning and hello to an immersive journey into Japan's language and culture.

**What it does:**

CrunchyLearn selects and streams anime clips based on the user’s imputed Genki vocabulary skill level. With those clips, the user then translates and submits their attempt at an English translation. This translation is then sent to the server to be compared with Google Cloud Translation API translation of the Japanese subtitles for the same clip. This comparison is done using Hugging Face’s Semantic Similarity Library, giving the server a value that is then converted for a score for the user to see.

**How we built it:**

Stack: React, Express, Node JS

APIs: Hugging Face Semantic Similarity Library, Google Cloud Translation API, 

Our database currently contains over 60 hours of footage in Japanese subtitles, which we web-scraped using a Python script from animelon.com, storing the subtitles along with their associated timestamps and metadata in json format. 

Our backend, built on Express and Node JS, runs a pre-trained transformer model developed by Hugging Face that will compare the user’s submitted translation with our own translation done by Google’s Cloud Translation API.

**Challenges we ran into:**

By far the biggest challenge we ran into was developing our anime dataset with correct time stamps for the Japanese subtitles. After a lot of time finding the right website to scrape and even developing an LLM model from Whisper to translate Japanese anime, we were able to effectively use HiAnime and Animelon to generate our dataset and perform CRUD operations with. We also had to be very deliberate about how we generated our anime dataset due to the large size, following the principle that “data that is accessed together must be stored together”. Finally, we overcame challenges properly integrating the Google Cloud API in order to translate the Japanese subtitles we scraped for our favourite anime series.

**Accomplishments that we're proud of**

We are proud to have developed a, hopefully, super intuitive and addictive app that helps the user learn both the language and culture of Japan, all while still being able to partake in the joy of watching anime with the need to learn languages at a fluent level.

**What we learned**

Considering the great differences in experience between the team members, we all took away differing lessons and experiences, be it the basics of creating a backend, GIT version control, or the eternal suffering that is pip.

**What's next for CrunchyLearn:**

Our next steps are to add even more anime to our database, continue expanding on the user experience and user feedback, and integrate a Cloud based platform into our app to allow us to expand in the future.
