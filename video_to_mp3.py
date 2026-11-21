# Convert videos to MP3
import os
import subprocess
files = os.listdir("YouTube_Videos")
os.makedirs("audios", exist_ok=True)

for file in files:
    if file.endswith(".webm"):

        tutorial_number = file.split(" - ")[0]

        file_name = file.split(" - ", 1)[1]
        file_name = file_name.rsplit(".", 1)[0]
        file_name = file_name.split("｜", 1)[0].strip()
        print(f"Converting: {tutorial_number} {file_name}")

        subprocess.run([
            "ffmpeg",
            "-i", f"YouTube_Videos/{file}",
            "-vn",
            f"audios/{tutorial_number}_{file_name}.mp3"
        ], check=True)
        print("Conversion completed!\n")