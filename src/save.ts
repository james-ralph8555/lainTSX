import { NodeID } from "./node";
import { SiteKind, CursorLocation, MatrixPosition2D } from "./site";

export type PolytanPartProgress = {
    body: boolean;
    head: boolean;
    left_arm: boolean;
    right_arm: boolean;
    left_leg: boolean;
    right_leg: boolean;
};

export type Progress = {
    sskn_level: number;
    gate_level: number;
    final_video_view_count: number;
    polytan_parts: PolytanPartProgress;
    viewed_nodes: Set<NodeID>;
};

export type GameState = {
    progress: Progress;
    site: SiteKind; // acts like a tag
    a_location: CursorLocation;
    b_location: CursorLocation;
    name: string;
};

const SAVE_KEY = "lainTSX-save-v3";

export function save_state(game_state: GameState, key: string = SAVE_KEY): void {
    const json = {
        ...game_state,
        progress: {
            ...game_state.progress,
            viewed_nodes: Array.from(game_state.progress.viewed_nodes),
        },
    };

    localStorage.setItem(key, JSON.stringify(json));
}

function get_default_state(): GameState {
    return {
        progress: {
            sskn_level: 0,
            gate_level: 0,
            final_video_view_count: 0,
            polytan_parts: {
                body: false,
                head: false,
                left_arm: false,
                right_arm: false,
                left_leg: false,
                right_leg: false,
            },
            viewed_nodes: new Set(),
        },
        site: SiteKind.A,
        a_location: {
            site_kind: SiteKind.A,
            level: 4,
            node_matrix_position: {
                row: 1,
                col: 0,
            },
            site_segment: 6,
        },
        b_location: {
            site_kind: SiteKind.B,
            level: 1,
            node_matrix_position: {
                row: 2,
                col: 0,
            },
            site_segment: 5,
        },
        name: "",
    };
}

export type GetSavedStateResult = {
    saved_state: GameState;
    found_valid_save: boolean;
};

function is_polytan_part_progress(obj: any): obj is PolytanPartProgress {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof obj.body === "boolean" &&
        typeof obj.head === "boolean" &&
        typeof obj.left_arm === "boolean" &&
        typeof obj.right_arm === "boolean" &&
        typeof obj.left_leg === "boolean" &&
        typeof obj.right_leg === "boolean"
    );
}

function is_progress(obj: any): obj is Progress {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof obj.sskn_level === "number" &&
        typeof obj.gate_level === "number" &&
        typeof obj.final_video_view_count === "number" &&
        is_polytan_part_progress(obj.polytan_parts) &&
        obj.viewed_nodes instanceof Set
    );
}

function is_site_kind(obj: any): obj is SiteKind {
    return typeof obj === "string" && (obj === SiteKind.A || obj === SiteKind.B);
}

function is_cursor_location(obj: any): obj is CursorLocation {
    return (
        typeof obj === "object" &&
        obj !== null &&
        is_matrix_position_2d(obj.node_matrix_position) &&
        typeof obj.level === "number" &&
        typeof obj.site_segment === "number" &&
        is_site_kind(obj.site_kind)
    );
}

function is_matrix_position_2d(obj: any): obj is MatrixPosition2D {
    return (
        typeof obj === "object" && obj !== null && typeof obj.row === "number" && typeof obj.col === "number"
    );
}

function validate_game_state(obj: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!is_progress(obj.progress)) {
        errors.push("invalid progress object");
    }

    if (!is_site_kind(obj.site)) {
        errors.push("invalid site kind");
    }

    if (!is_cursor_location(obj.a_location)) {
        errors.push("invalid a_location");
    }

    if (!is_cursor_location(obj.b_location)) {
        errors.push("invalid b_location");
    }

    if (typeof obj.name !== "string") {
        errors.push("name must be a string");
    }

    return { valid: errors.length === 0, errors };
}

export function get_saved_state(): GetSavedStateResult {
    const default_save = get_default_state();

    try {
        const save = localStorage.getItem(SAVE_KEY);

        if (save === null || save === "null" || save === undefined || save.trim() === "") {
            return { saved_state: default_save, found_valid_save: false };
        }

        const parsed = JSON.parse(save);
        const state: GameState = {
            ...parsed,
            progress: {
                ...parsed.progress,
                viewed_nodes: new Set<NodeID>(parsed.progress.viewed_nodes),
            },
        };

        const { valid, errors } = validate_game_state(state);
        if (!valid) {
            console.error(`corrupted save file: ${errors}`);
            return { saved_state: default_save, found_valid_save: false };
        }

        if (state.progress.gate_level > 4) {
            state.progress.gate_level = 4;
        }

        if (state.progress.gate_level < 0) {
            state.progress.gate_level = 0;
        }

        return { saved_state: state, found_valid_save: true };
    } catch (err) {
        console.warn("failed to load save:", err);
        return { saved_state: default_save, found_valid_save: false };
    }
}

export function has_valid_save_state(): boolean {
    try {
        const save = localStorage.getItem(SAVE_KEY);

        if (save === null || save === undefined || save.trim() === "") {
            return false;
        }

        JSON.parse(save);

        return true;
    } catch (err) {
        return false;
    }
}

export function get_current_location(game_state: GameState): CursorLocation {
    switch (game_state.site) {
        case SiteKind.A:
            return game_state.a_location;
        case SiteKind.B:
            return game_state.b_location;
    }
}
