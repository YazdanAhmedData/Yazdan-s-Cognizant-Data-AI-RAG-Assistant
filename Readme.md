# how to use this assistant on any other data 
## Step 1 - Collect your videos 
Move all your videos file to the videos folder

## Step 2 - convert to mp3 
Convert all the videos files to mp3 by running videos_to_m3

## Step 3 - Convert mp3 to jsons
Convert all the mp3 files to json by running mp3_to_json

## Step 4 - Convert the Json files to vectors 
Use the file preprocess_json to convert the json files to a dataframe with embeddings and save it as 
a joblib pickle 

## Step 5 - Prompt generation and feeding to LLM

Read the joblib file and load it into the memory . then create a relevant prompt as per the user query 
and feed it to the LLM

