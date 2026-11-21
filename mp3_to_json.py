
import whisper
import json
import os

model = whisper.load_model("base")
audios = os.listdir("audios")
os.makedirs("jsons", exist_ok=True)
for audio in audios:

    if not audio.endswith(".mp3") or "_" not in audio:
        continue
    print(f"\nProcessing: {audio}")
    number, title = audio.split("_", 1)
    title = os.path.splitext(title)[0]
    print(number, title)
    result = model.transcribe(
        audio=f"audios/{audio}",
        language="en",
        task="transcribe",
        word_timestamps=False,
        fp16=False
    )
    chunks = []

    for segment in result["segments"]:
        chunks.append({
            "number": number,
            "title": title,
            "start": segment["start"],
            "end": segment["end"],
            "text": segment["text"]
        })
    chunks_with_metadata = {
        "chunks": chunks,
        "text": result["text"]
    }
    with open(f"jsons/{audio}.json", "w", encoding="utf-8") as f:
        json.dump(chunks_with_metadata, f, indent=4, ensure_ascii=False)

    print(f"Completed: {audio}")
    print(f"Total chunks: {len(chunks)}")
print("\nAll audio files processed successfully!")
