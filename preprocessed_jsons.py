
import requests
import os
import json
import numpy as np
import time
import pandas as pd 
from sklearn.metrics.pairwise import cosine_similarity
import joblib

INPUT_FOLDER = "jsons"
OUTPUT_FOLDER = "new_embedded_jsons"
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


json_files = sorted(os.listdir(INPUT_FOLDER))

total_chunks = 0
total_videos = 0

for json_file in json_files:

    if not json_file.endswith(".json"):
        continue

    input_path = os.path.join(INPUT_FOLDER, json_file)

    output_path = os.path.join(
        OUTPUT_FOLDER,
        json_file
    )

    # Skip already completed videos
    if os.path.exists(output_path):

        print(f"Already embedded: {json_file}")
        continue

    print(f"\nProcessing: {json_file}")
    with open(input_path, "r", encoding="utf-8") as f:
        content = json.load(f)

    chunks = content.get("chunks", [])

    if not chunks:
        print(f"Skipping empty file: {json_file}")
        continue

    texts = [
        chunk["text"]
        for chunk in chunks
    ]

    print(f"Total chunks: {len(texts)}")
    print(
        f"Longest chunk: "
        f"{max(len(text) for text in texts)} characters"
    )

    embeddings = create_embedding(texts)

    if len(embeddings) != len(chunks):

        raise Exception(
            f"Embedding count mismatch in {json_file}"
        )


    for index, (chunk, embedding) in enumerate(
        zip(chunks, embeddings)
    ):

        chunk["chunk_id"] = f"{json_file}_{index}"
        chunk["embedding"] = embedding

    content["chunks"] = chunks


    with open(output_path, "w", encoding="utf-8") as f:

        json.dump(
            content,
            f,
            ensure_ascii=False
        )

    total_chunks += len(chunks)
    total_videos += 1

    print(
        f"Completed: {json_file} | "
        f"Total chunks: {len(chunks)}"
    )


print("\n===================================")
print("EMBEDDING PROCESS COMPLETED")
print("===================================")

print(f"Videos processed this run: {total_videos}")
print(f"Chunks embedded this run: {total_chunks}")
print(f"Output folder: {OUTPUT_FOLDER}")

# -----------------------------------------
# 8. LOAD EMBEDDED JSON FILES INTO DATAFRAME
# -----------------------------------------

json_files = sorted(os.listdir(OUTPUT_FOLDER))

my_dicts = []

for json_file in json_files:

    if not json_file.endswith(".json"):
        continue

    file_path = os.path.join(OUTPUT_FOLDER, json_file)

    with open(file_path, "r", encoding="utf-8") as f:
        content = json.load(f)

    chunks = content.get("chunks", [])

    my_dicts.extend(chunks)

df = pd.DataFrame.from_records(my_dicts)

print("\nDataFrame Created Successfully!")
print(df)
print("\nDataFrame Shape:", df.shape)
print("\nDataFrame Columns:")
print(df.columns)

# Save DataFrame for future use

joblib.dump(df, 'embeddings.pkl')
print("Embeddings saved successfully!")
