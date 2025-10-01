import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import KaitaiStream from "kaitai-struct/KaitaiStream.js";
import Lapk from "./Lapk.cjs";
import { try_spawn_process } from "./util.mjs";
import crypto from "crypto";

export function extract_lapks(tempdir, jpsxdec_jar) {
    try_spawn_process("java", [
        "-jar",
        jpsxdec_jar,
        "-x",
        join(tempdir, "disc1.idx"),
        "-i",
        "LAPKS.BIN",
        "-dir",
        tempdir,
    ]);
    const lapk_info = JSON.parse(readFileSync("lapks.json"));

    let lapk_data = readFileSync(join(tempdir, "LAPKS.BIN"));
    let output_folder = join("..", "src", "static", "sprites", "lain");

    mkdirSync(output_folder, { recursive: true });

    let images = [];
    for (let [index, lapk_entry] of lapk_info.entries()) {
        let data = lapk_data.slice(lapk_entry.offset, lapk_entry.offset + lapk_entry.size);
        let parsed_lapk = new Lapk(new KaitaiStream(data));

        for (let [frame_number, cell_data] of parsed_lapk.data.cellData.entries()) {
            const cell_header = parsed_lapk.data.cellHeaders[frame_number];
            // create bitstream header (from https://github.com/m35/jpsxdec/blob/1de0518583236844b93f5fcc8a4d330a01c222b3/laintools/src/laintools/Lain_LAPKS.java#L319)
            let bitstream_header = Buffer.alloc(8);
            bitstream_header.writeInt8(cell_data.chrominanceQuantisationScale);
            bitstream_header.writeInt8(cell_data.luminanceQuantisationScale, 1);
            bitstream_header.writeInt16LE(0x3800, 2);
            bitstream_header.writeInt16LE(cell_data.runLengthCodeCount, 4);
            bitstream_header.writeInt16LE(0x0000, 6);
            let output_bitstream = Buffer.concat(
                [bitstream_header, cell_data.imageData],
                cell_data.imageDataSize + 8,
            );
            let bitstream_file = join(tempdir, `${index}_${frame_number}.bs`);
            let out_frame = join(tempdir, `${index}_${frame_number}.png`);
            let out_mask = join(tempdir, `${index}_${frame_number}_mask.gray`);
            let out_alpha = join(tempdir, `${index}_${frame_number}_alpha.png`);
            writeFileSync(bitstream_file, output_bitstream);
            writeFileSync(out_mask, Buffer.from(cell_data.bitMask));
            try_spawn_process(
                "java",
                [
                    "-jar",
                    jpsxdec_jar,
                    "-f",
                    resolve(bitstream_file),
                    "-static",
                    "bs",
                    "-dim",
                    `${cell_data.width}x${cell_data.height}`,
                    "-up",
                    "Lanczos3",
                ],
                { cwd: tempdir },
            );
            try_spawn_process("magick", [
                "-background",
                "none",
                "(",
                "xc:none",
                "-extent",
                "352x367",
                ")",
                "(",
                out_frame,
                "(",
                "-depth",
                "2",
                "-size",
                `${cell_data.width}x${cell_data.height}`,
                out_mask,
                "-alpha",
                "off",
                ")",
                "-compose",
                "copy-opacity",
                "-composite",
                ")",
                "-geometry",
                `+${320 / 2 + 4 - cell_header.negativeXPosition}+${352 - 1 - cell_header.negativeYPosition}`,
                "-compose",
                "over",
                "-composite",
                out_alpha,
            ]);
            images.push(`${index}_${frame_number}`);
        }
    }

    const talk_frame_prefixes = ["7_", "53_", "55_", "56_", "57_", "58_"];

    const unique_talk_frames = [];
    const unique_frames = [];
    const seen_image_hashes = new Set();
    images.forEach((frame_name) => {
        let is_talk = false;
        talk_frame_prefixes.forEach((talk_frame) => {
            if (frame_name.startsWith(talk_frame)) {
                is_talk = true;
                return;
            }
        });

        const path = join(tempdir, `${frame_name}.png`);
        const img = readFileSync(path);
        const hash = crypto.createHash("sha256").update(img).digest("hex");

        if (!seen_image_hashes.has(hash)) {
            if (is_talk) {
                unique_talk_frames.push(join(tempdir, `${frame_name}_alpha.png`));
            } else {
                unique_frames.push(join(tempdir, `${frame_name}_alpha.png`));
            }
        }

        seen_image_hashes.add(hash);
    });

    const sets = [
        { set_name: "lain_frames", entries: unique_frames },
        { set_name: "lain_talk_frames", entries: unique_talk_frames },
    ];

    sets.forEach((set) => {
        const { set_name, entries } = set;

        let n = 0;
        for (let chunk = 0; chunk < entries.length; chunk += 25) {
            try_spawn_process("magick", [
                "montage",
                "-background",
                "none",
                "-tile",
                `5x5`,
                "-geometry",
                "+0+0",
                ...entries.slice(chunk, chunk + 25),
                join(tempdir, `${set_name}_${n}.png`),
            ]);

            try_spawn_process("magick", [
                join(tempdir, `${set_name}_${n}.png`),
                "-background",
                "none",
                "-gravity",
                "NorthWest",
                "-extent",
                `2048x2048`,
                join(output_folder, `${set_name}_${n}.png`),
            ]);

            n++;
        }
    });

    const emotes = [
        { name: "Pray", frame_index: 484 },
        { name: "Fix Sleeves", frame_index: 334 },
        { name: "Think", frame_index: 421 },
        { name: "Stretch 2", frame_index: 307 },
        { name: "Stretch", frame_index: 450 },
        { name: "Spin", frame_index: 346 },
        { name: "Scratch Head", frame_index: 405 },
        { name: "Blush", frame_index: 466 },
        { name: "Naruto", frame_index: 321 },
        { name: "Hug Self", frame_index: 175 },
        { name: "Count", frame_index: 89 },
        { name: "Angry", frame_index: 295 },
        { name: "Ponder", frame_index: 392 },
        { name: "Lean Forward", frame_index: 501 },
        { name: "Lean Left", frame_index: 534 },
        { name: "Lean Right", frame_index: 557 },
        { name: "Look Around", frame_index: 373 },
        { name: "Play With Hair", frame_index: 519 },
        { name: "Eureka", frame_index: 433 },
        { name: "Open The Next", frame_index: 596 }
    ]

    const emote_output_folder = join("..", "public", "emote-wheel")

    mkdirSync(emote_output_folder, { recursive: true });

    emotes.forEach(emote => {
        const { name, frame_index } = emote
        const frame = unique_frames[frame_index]
        const outputPath = join(emote_output_folder, `${name}.png`)

        try_spawn_process("magick", [
            frame,
            "-crop",
            "0x250+0+0",
            "+repage",
            outputPath,
        ]);
    })
}
