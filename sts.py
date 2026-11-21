
import whisper
import json
model = whisper.load_model("base")

result = model.transcribe(
    audio="audios/002_How Cognizant and Google Cloud are Transforming Healthcare with Agentic AI.mp3",
    language="en",
    task="translate",
    word_timestamps=False
)
chunks = []
for segment in result["segments"]:
    chunks.append({"start":segment["start"],"end":segment["end"],"text": segment["text"]})

print(chunks)

with open("output.json", "w") as f:
    json.dump(chunks,f)

#print(result["text"])
#with open("output.json", "w", encoding="utf-8") as f:
   # json.dump(result, f, indent=4, ensure_ascii=False)

#print("Transcription completed successfully!")
