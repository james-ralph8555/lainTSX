import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { try_spawn_process } from "./util.mjs";

export function extract_voice(tempdir, jpsxdec_jar) {
    try_spawn_process("java", [
        "-jar",
        jpsxdec_jar,
        "-x",
        join(tempdir, "disc1.idx"),
        "-i",
        "VOICE.BIN",
        "-dir",
        tempdir,
    ]);

    const voice_files = JSON.parse(readFileSync("voice.json"));

    let voice_data = readFileSync(join(tempdir, "VOICE.BIN"));
    let output_folder = join("..", "public", "voice");

    mkdirSync(output_folder, { recursive: true });

    for (let voice_file of voice_files) {
        let tempfile = join(tempdir, voice_file.translated_name);
        let outfile = join(output_folder, voice_file.translated_name.replace("WAV", "mp4"));
        let data = voice_data.slice(voice_file.offset, voice_file.offset + voice_file.size);
        writeFileSync(tempfile, data);
        if (["BYA.WAV", "BYO.WAV", "BYU.WAV"].includes(voice_file.original_name)) {
            try_spawn_process("ffmpeg", ["-i", tempfile, outfile]);
        } else {
            try_spawn_process("ffmpeg", ["-sample_rate", 22050, "-f", "s16le", "-i", tempfile, outfile]);
        }
    }
}
