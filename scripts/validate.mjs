import { OUTPUT_AUDIO_FOLDER, OUTPUT_MOVIE_FOLDER } from "./extract_media.mjs"
import { readdirSync } from "fs";
import site_a_json from "../src/static/json/site_a.json" with { type: "json" };
import site_b_json from "../src/static/json/site_b.json" with { type: "json" };

const found_movies = new Set()

const found_audio = new Set()

function strip_extension(str) {
        return str.replace(/\.[^/.]+$/, "")
}

function validate_idle_videos() {
        const idle_video_files = [
                "INS01.STR[0]",
                "INS02.STR[0]",
                "INS03.STR[0]",
                "INS04.STR[0]",
                "INS05.STR[0]",
                "INS06.STR[0]",
                "INS07.STR[0]",
                "INS08.STR[0]",
                "INS09.STR[0]",
                "INS10.STR[0]",
                "INS11.STR[0]",
                "INS12.STR[0]",
                "INS13.STR[0]",
                "INS14.STR[0]",
                "INS15.STR[0]",
                "INS16.STR[0]",
                "INS17.STR[0]",
                "INS18.STR[0]",
                "INS19.STR[0]",
                "INS20.STR[0]",
                "INS21.STR[0]",
                "INS22.STR[0]",
                "INS16.STR[0]",
                "INS17.STR[0]",
                "INS18.STR[0]",
                "INS19.STR[0]",
                "INS20.STR[0]",
                "INS21.STR[0]",
                "INS22.STR[0]",
                "PO1.STR[0]",
                "PO2.STR[0]"
        ]

        const missing = []

        for (const file of idle_video_files) {
                if (!found_movies.has(file)) {
                        missing.push(file)
                }
        }

        return missing;
}

function validate_end_audio() {
        const end_audio_files = [
                "LAIN21.XA[31]",
                "LAIN21.XA[16]"
        ]

        const missing = []

        for (const file of end_audio_files) {
                if (!found_audio.has(file)) {
                        missing.push(file)
                }
        }

        return missing;
}

function validate_node_media() {
        const all_node_media = new Set()
        for (const layout of [site_a_json, site_b_json]) {
                for (const level of layout) {
                        for (const row of level) {
                                for (const node of row) {
                                        if (node) {
                                                all_node_media.add(node.media_file)
                                        }
                                }
                        }
                }
        }

        const missing = []
        for (const media of all_node_media) {
                if (!found_movies.has(media) && !found_audio.has(media)) {
                        missing.push(media)
                }
        }

        return missing
}

export function validate_extraction() {
        for (const file of readdirSync(OUTPUT_MOVIE_FOLDER)) {
                found_movies.add(strip_extension(file))
        }

        for (const file of readdirSync(OUTPUT_AUDIO_FOLDER)) {
                found_audio.add(strip_extension(file))
        }

        console.log("validating extraction...")

        const missing = [...validate_idle_videos(), ...validate_node_media(), ...validate_end_audio()]

        if (missing.length > 0) {
                console.log("missing the following media files:")
                console.log(missing)
        } else {
                console.log("validation finished successfully")
        }

}
