
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import requests
import time
import os
import json
import joblib


INPUT_FOLDER = "jsons"
OUTPUT_FOLDER = "embedded_jsons"
MODEL_NAME = "bge-m3"
OLLAMA_URL = "http://localhost:11434/api/embed"

BATCH_SIZE = 8
MAX_RETRIES = 3

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def create_embedding(texts):
    all_embeddings = []

    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start:start + BATCH_SIZE]

        for attempt in range(MAX_RETRIES):
            try:

                response = requests.post(
                    OLLAMA_URL,
                    json={
                        "model": MODEL_NAME,
                        "input": batch
                    },
                    timeout=300
                )

                if response.status_code == 200:
                    result = response.json()

                    if "embeddings" not in result:
                        raise Exception(
                            f"Missing embeddings: {result}"
                        )

                    all_embeddings.extend(result["embeddings"])
                    break

                print("\nOllama Error:", response.status_code)
                print("Details:", response.text[:1000])

            except requests.exceptions.RequestException as e:

                print("Request failed:", e)

            if attempt < MAX_RETRIES - 1:
                print(
                    f"Retrying batch... "
                    f"{attempt + 1}/{MAX_RETRIES}"
                )
                time.sleep(3)

        else:

            raise Exception(
                f"Embedding failed at batch starting index {start}"
            )

    return all_embeddings

def inference(prompt):

    print("\nLlama 3.2 is generating your response...\n")
    print("=" * 80)

    generated_response = ""

    with requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2",
            "prompt": prompt,
            "stream": True
        },
        stream=True,
        timeout=300
    ) as r:

        r.raise_for_status()

        for line in r.iter_lines():

            if line:

                data = json.loads(line)

                if "response" in data:

                    token = data["response"]

                    print(token, end="", flush=True)

                    generated_response += token

    print("\n" + "=" * 80)

    return generated_response


df = joblib.load('embeddings.pkl')
incoming_query = input("Ask a question: ")
question_embedding = create_embedding([incoming_query])[0]


similarities = cosine_similarity(
    np.vstack(df['embedding'].values),
    [question_embedding]
)

print("\nSimilarity calculation completed!")
print("Similarity shape:", similarities.shape)

top_results = similarities.flatten().argsort()[::-1][:5]
print("\nTop 5 Relevant Chunks:")
print("=" * 80)

for rank, index in enumerate(top_results, start=1):

    print(f"\nRank: {rank}")

    print(
        "Similarity Score:",
        similarities[index][0]
    )
    print(
        "Video Title:",
        df.iloc[index]['title']
    )
    print(
        "Start Time:",
        df.iloc[index]['start']
    )
    print(
        "End Time:",
        df.iloc[index]['end']
    )
    print(
        "Text:",
        df.iloc[index]['text']
    )
    print("-" * 80)

top_results = 3
max_indx = similarities.flatten().argsort()[::-1][:top_results]

print("Top 3 matching indices:")
print(max_indx)

new_df = df.iloc[max_indx]

print("\nTop 3 Relevant Results:\n")
print(new_df[["title", "number", "text"]])

prompt = f"""
You are a specialized Course Navigation Assistant for
Cognizant's Data & AI course, which consists of 182 videos.

Your job is to help learners locate where a particular
concept is explained in the course.

COURSE CONTEXT:
The learner has access to a 182-video playlist covering
Data & AI topics.

RETRIEVED VIDEO SUBTITLE CHUNKS:

{new_df[["title", "number", "start", "end", "text"]].to_json(orient="records", indent=2)}

USER QUESTION:
{incoming_query}

YOUR TASK:

1. Analyze the retrieved subtitle chunks carefully.
2. Identify which video explains the concept asked by the user.
3. Mention the video number and exact video title.
4. Mention the start and end timestamps where the
   relevant concept is discussed.
5. Explain briefly what is taught in that section.
6. Guide the learner to open the relevant video and
   navigate to the specified timestamp.

IMPORTANT RULES:

- Answer strictly using the retrieved video subtitles.
- Never invent video titles, timestamps, or course content.
- If multiple retrieved chunks are relevant, mention all
  relevant videos and their timestamps.
- If a concept is mentioned only briefly, clearly say so.
- If the retrieved chunks do not contain enough information
  to answer confidently, say that you could not locate
  the concept in the retrieved sections.
- Do not pretend that a concept is taught in a video
  merely because its title sounds relevant.
- Do not answer unrelated questions.
- If the user asks something unrelated to the Cognizant
  Data & AI course, politely explain that you can only
  answer questions related to this course.

RESPONSE FORMAT:

### Concept Location
Explain where the requested concept is discussed.

### Video Navigation
For each relevant result, provide:
- Video number
- Video title
- Start timestamp
- End timestamp
- What is taught in this section

### Learning Guidance
Tell the learner which video to watch and what to focus on.

Be accurate, concise, and helpful.
"""

with open("prompt.txt", "w", encoding="utf-8") as f:
    f.write(prompt)

print("\nPrompt created successfully!")

generated_response = inference(prompt)

print("\n========================================")
print("       RAG ASSISTANT RESPONSE")
print("========================================\n")

print(generated_response)


with open("response.txt", "w", encoding="utf-8") as f:
    f.write(generated_response)

print("\nResponse saved successfully in response.txt")


