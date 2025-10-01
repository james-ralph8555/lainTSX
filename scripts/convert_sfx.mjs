import { readdirSync } from "fs";
import { join } from "path";
import * as mm from "music-metadata";
import { try_spawn_process } from "./util.mjs";

// stub implementation of upping the pitch of the sfx, still wip
export async function convert_sfx() {
  const dir = join("..", "public", "sfx");
  for (let file of readdirSync(dir)) {
    if (file.includes("snd")) {
      console.log(file);
      const metaData = await mm.parseFile(`${join(dir, file)}`);

      const sampleRate = metaData.format.sampleRate;

      try_spawn_process(
        "ffmpeg",
        [
          "-i",
          join(dir, file),
          "-filter_complex",
          `asetrate=${sampleRate}*2^(6/12),atempo=1/2^(6/12)`,
          join(dir, "..", "t", file),
        ],
        { stdio: "inherit" }
      );
    }
  }
}

convert_sfx();
