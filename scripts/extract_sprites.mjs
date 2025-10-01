import { try_spawn_process } from "./util.mjs";
import { join, resolve } from "path";
import { readFileSync, readdirSync, rmSync, mkdirSync, writeFileSync, copyFileSync } from "fs";
import LainCompress from "./lain_compress.cjs";
import { PNG } from "pngjs";
import sharp from "sharp";
import { MaxRectsPacker } from "maxrects-packer";

function extract_bin_bin(tempdir, jpsxdec_jar) {
    try_spawn_process("java", [
        "-jar",
        jpsxdec_jar,
        "-x",
        join(tempdir, "disc1.idx"),
        "-i",
        `BIN.BIN`,
        "-dir",
        tempdir,
    ]);
    const bin_entries = JSON.parse(readFileSync(`bin_bin.json`));

    let image_data = readFileSync(join(tempdir, `BIN.BIN`));

    for (let [index, entry] of bin_entries.entries()) {
        // not an image (voice lookup table thingy)
        if (index === 20) {
            continue;
        }

        let data;
        if (entry.compressed) {
            data = image_data.slice(entry.offset + 4, entry.offset + entry.size);
            data = new LainCompress().decode(data);
        } else {
            data = image_data.slice(entry.offset, entry.offset + entry.size);
        }

        let tim_file = resolve(join(tempdir, `bin_${index}.tim`));
        writeFileSync(tim_file, data);

        try_spawn_process("java", ["-jar", jpsxdec_jar, "-f", tim_file, "-static", "tim"], { cwd: tempdir });
    }
}

function component_to_hex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgb_to_hex(r, g, b) {
    return component_to_hex(r) + component_to_hex(g) + component_to_hex(b);
}

function hex_to_component(hex) {
    return parseInt(hex, 16);
}

function hex_to_rgb(hex) {
    const r = hex_to_component(hex.substring(0, 2));
    const g = hex_to_component(hex.substring(2, 4));
    const b = hex_to_component(hex.substring(4, 6));

    return [r, g, b];
}

function capitalize_first(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function extract_sprites(tempdir, jpsxdec_jar) {
    const atlas_item_dir = join(tempdir, "atlasitems");

    mkdirSync(atlas_item_dir, { recursive: true });

    readdirSync(atlas_item_dir).forEach((f) => rmSync(`${atlas_item_dir}/${f}`, { recursive: true }));

    extract_bin_bin(tempdir, jpsxdec_jar);

    const names = [
        ["SLPS_016.03[0]_p00.png", "main_scene_bg.png"],
        ["SLPS_016.03[1]_p00.png", "gray_ring_lof.png"],
        ["SLPS_016.03[2]_p00.png", "gray_ring_life.png"],
        ["SLPS_016.03[3]_p00.png", "gray_ring_sides.png"],
        ["SLPS_016.03[4]_p00.png", "purple_ring_site_a.png"],
        ["SLPS_016.03[5]_p00.png", "purple_ring_site_b.png"],
        ["SLPS_016.03[6]_p00.png", "middle_ring.png"],
        ["SLPS_016.03[7]_p00.png", "purple_ring_level_font.png"],
        ["SLPS_016.03[8]_p00.png", null],
        ["SLPS_016.03[9]_p00.png", null],
        ["SLPS_016.03[10]_p00.png", null],
        ["SLPS_016.03[11]_p00.png", null],
        ["SLPS_016.03[13]_p00.png", "dark_gray_box.png"],
        ["SLPS_016.03[14]_p00.png", "light_gray_box.png"],
        ["SLPS_016.03[15]_p00.png", "lda.png"],
        ["SLPS_016.03[16]_p00.png", "lda_dark.png"],
        ["SLPS_016.03[17]_p00.png", "tda.png"],
        ["SLPS_016.03[18]_p00.png", "cou.png"],
        ["SLPS_016.03[19]_p00.png", "sskn.png"],
        ["SLPS_016.03[20]_p00.png", "generic_node.png"],
        ["SLPS_016.03[21]_p00.png", "dc.png"],
        ["SLPS_016.03[22]_p00.png", "dia.png"],
        ["SLPS_016.03[23]_p00.png", "lda_gold.png"],
        ["SLPS_016.03[24]_p00.png", "lda_active.png"],
        ["SLPS_016.03[25]_p00.png", "lda_viewed.png"],
        ["SLPS_016.03[26]_p00.png", "lda_dark_viewed.png"],
        ["SLPS_016.03[27]_p00.png", "tda_viewed.png"],
        ["SLPS_016.03[28]_p00.png", "cou_viewed.png"],
        ["SLPS_016.03[29]_p00.png", "sskn_viewed.png"],
        ["SLPS_016.03[30]_p00.png", "generic_node_viewed.png"],
        ["SLPS_016.03[31]_p00.png", "dc_viewed.png"],
        ["SLPS_016.03[32]_p00.png", "dia_viewed.png"],
        ["SLPS_016.03[33]_p00.png", "gate_mirror.png"],
        ["SLPS_016.03[34]_p00.png", "gray_gradient.png"],
        ["BIN.BIN[0]_p00.png", null],
        ["bin_30_p0.png", "end_cylinder_2.png"],
        ["bin_8_p0.png", "jp_font.png"],
        ["bin_1_p0.png", "font_3.png"],
        ["bin_1_p1.png", "font_2.png"],
        ["bin_1_p2.png", "font_1.png"],
        ["bin_32_p0.png", "polytan_body.png"],
        ["bin_33_p0.png", "polytan_left_arm.png"],
        ["bin_34_p0.png", "polytan_right_arm.png"],
        ["bin_35_p0.png", "polytan_left_leg.png"],
        ["bin_36_p0.png", "polytan_right_leg.png"],
        ["bin_37_p0.png", "polytan_head.png"],
        ["bin_38_p0.png", "polytan_bg_leg.png"],
        ["bin_39_p0.png", "polytan_bg_head.png"],
        ["bin_41_p0.png", "polytan_skeleton.png"],
        ["bin_11_p0.png", "sskn_background.png"],
    ];

    try_spawn_process("java", [
        "-jar",
        jpsxdec_jar,
        "-x",
        join(tempdir, "disc1.idx"),
        "-i",
        "39",
        "-dir",
        tempdir,
    ]);

    for (let item = 1; item < 36; item++) {
        if ([9, 10, 11, 12].includes(item)) {
            // useless
            continue;
        }

        try_spawn_process("java", [
            "-jar",
            jpsxdec_jar,
            "-x",
            join(tempdir, "disc1.idx"),
            "-i",
            `${item}`,
            "-dir",
            tempdir,
        ]);
    }

    for (const item of names) {
        const [from_filename, to_filename] = item;

        if (to_filename === null) {
            continue;
        }

        const from = join(tempdir, from_filename);
        const to = join(atlas_item_dir, to_filename);

        copyFileSync(from, to);
    }

    const NORMAL_TO_ACTIVE_PALETTE = {
        "000000": "000000",
        "5252b5": "84f7c5",
        "423a7b": "429473",
        312142: "002929",
        "5a5ab5": "8cf7ce",
        a5c5c5: "ffffff",
        "6b6bb5": "94f7d6",
        "7b7bbd": "9cf7de",
        "8484bd": "a5f7e6",
        "9494bd": "adf7ef",
        "63738c": "7b9494",
        a5a5c5: "b5fff7",
        b5b5d6: "cefff7",
        c5c5e6: "e6fff7",
        d6d6f7: "ffffff",
    };

    const NORMAL_TO_GOLD_PALETTE = {
        "000000": "000000",
        "5252b5": "a5a500",
        "423a7b": "424200",
        312142: "737300",
        "5a5ab5": "adad10",
        a5c5c5: "ffffc5",
        "6b6bb5": "b5b529",
        "7b7bbd": "bdbd42",
        "8484bd": "c5c552",
        "9494bd": "cece6b",
        "63738c": "b5b563",
        a5a5c5: "d6d684",
        b5b5d6: "dedead",
        c5c5e6: "efefd6",
        d6d6f7: "ffffff",
    };

    for (const node of ["lda", "tda", "cou", "sskn", "generic_node", "dc", "dia"]) {
        console.log(`working on node ${node}...`);

        const image_buffer = readFileSync(join(atlas_item_dir, node + ".png"));

        {
            const png = PNG.sync.read(image_buffer);

            for (let y = 0; y < png.height; y++) {
                for (let x = 0; x < png.width; x++) {
                    const idx = (png.width * y + x) << 2;

                    const r = png.data[idx];
                    const g = png.data[idx + 1];
                    const b = png.data[idx + 2];

                    const color = hex_to_rgb(NORMAL_TO_ACTIVE_PALETTE[rgb_to_hex(r, g, b)]);

                    png.data[idx] = color[0];
                    png.data[idx + 1] = color[1];
                    png.data[idx + 2] = color[2];
                }
            }

            const output_buffer = PNG.sync.write(png);
            writeFileSync(join(atlas_item_dir, `${node}_active.png`), output_buffer);
        }

        {
            const png = PNG.sync.read(image_buffer);

            for (let y = 0; y < png.height; y++) {
                for (let x = 0; x < png.width; x++) {
                    const idx = (png.width * y + x) << 2;

                    const r = png.data[idx];
                    const g = png.data[idx + 1];
                    const b = png.data[idx + 2];

                    const color = hex_to_rgb(NORMAL_TO_GOLD_PALETTE[rgb_to_hex(r, g, b)]);

                    png.data[idx] = color[0];
                    png.data[idx + 1] = color[1];
                    png.data[idx + 2] = color[2];
                }
            }

            const output_buffer = PNG.sync.write(png);
            writeFileSync(join(atlas_item_dir, `${node}_gold.png`), output_buffer);
        }
    }

    const spritesheet_commands = JSON.parse(readFileSync(`sprites.json`));
    for (const item of spritesheet_commands) {
        for (const command of item.commands) {
            const split = command.split(" ");
            try_spawn_process(split[0], split.slice(1), { cwd: tempdir });
        }

        copyFileSync(join(tempdir, item.name), join(atlas_item_dir, item.name));
    }

    const packer_inputs = [];
    const atlas_items = readdirSync(atlas_item_dir);
    await Promise.all(
        atlas_items.map(async (atlas_item) => {
            const metadata = await sharp(join(atlas_item_dir, atlas_item)).metadata();

            packer_inputs.push({
                width: metadata.width,
                height: metadata.height,
                name: atlas_item,
            });
        }),
    );

    const options = {
        smart: true,
        pot: true,
        square: true,
        allowRotation: false,
        tag: false,
        border: 0,
    };

    const packer = new MaxRectsPacker(2048, 2048, 0, options);
    packer.addArray(packer_inputs);

    const canvas = sharp({
        create: {
            width: 2048,
            height: 2048,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    });

    const rects = packer.bins[0].rects;

    const compositeOperations = await Promise.all(
        rects.map(async ({ name, x, y }) => {
            const image = sharp(join(atlas_item_dir, name));

            const normalized = await image.ensureAlpha().toBuffer();

            return {
                input: normalized,
                top: y,
                left: x,
            };
        }),
    );

    const enums = rects.map(({ name }) => {
        return name
            .slice(0, name.length - 4)
            .split("_")
            .map((word) => capitalize_first(word))
            .join("_");
    });

    const sprite_atlas = rects.map(({ x, y, width, height }) => {
        return { x, y, w: width, h: height };
    });

    const enum_text = `export enum Texture {
                ${enums.join(",")}
        };`;
    writeFileSync(join("..", "src", "textures.ts"), enum_text);

    const atlas_buf = await canvas.composite(compositeOperations).png().toBuffer();

    mkdirSync(join("..", "src", "static", "sprites"), { recursive: true })
    await sharp(atlas_buf).toFile(join("..", "src", "static", "sprites", "game.png"));

    writeFileSync(join("..", "src", "static", "json", "sprite_atlas.json"), JSON.stringify(sprite_atlas));

    console.log("generating icon...")

    await sharp(join(tempdir, "bin_37_p0.png"))
        .resize(32, 32)
        .png()
        .toFile(join("..", "public", "images", "icon.png"));
}
