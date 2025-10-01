import * as THREE from "three";
import frag_node from "./static/shaders/node.frag?raw";
import vert_node from "./static/shaders/node.vert?raw";
import { ModelKind, SFX, TimeContext, get_texture, get_texture_atlas, play_audio } from "./engine";
import vert_thick_line from "./static/shaders/thick_line.vert?raw";
import frag_thick_line from "./static/shaders/thick_line.frag?raw";
import {
    Direction,
    get_level_count,
    get_level_y,
    SiteKind,
    SiteRow,
    NodeSegmentMatrixRow,
    NodeSegmentMatrix,
    SiteLayout,
    MatrixPosition2D,
    SiteScene,
    CursorLocation,
    SITE_A_NODES,
    SITE_B_NODES,
} from "./site";
import { Texture } from "./textures";
import { euler, get_bounding_box, random_between, random_from, random_rotation, vec3 } from "./util";
import { AnimationProperty, Animations, Euler, GLBModel, Group, Mesh, Vec3 } from "./objects";
import { GameState, Progress, save_state } from "./save";

const DEFAULT_NODE_NAME = "Unknown";

export type NodeID = string;

export const NODE_YELLOW_LINE_COLOR = 0xfffb00;
export const NODE_RED_LINE_COLOR = 0xe33d00;
export const NODE_ORANGE_LINE_COLOR = 0xfc9803;

export type NodeData = {
    id: NodeID;
    image_table_indices: (number | null)[];
    triggers_final_video: number;
    required_final_video_viewcount: number;
    media_file: string;
    name: string;
    site: SiteKind;
    type: number;
    title: string;
    unlocked_by: string | null;
    upgrade_requirement: number;
    words: (string | null)[];
    protocol_lines: (string | null)[];
    position: number;
    level: number;
};

export type NodeMesh = Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

export type Node = NodeData & {
    mesh: NodeMesh;
};

enum NodeState {
    Normal,
    Active,
    Viewed,
    Gold,
}

export enum NodeKind {
    Lda = 0,
    Tda = 2,
    Cou = 3,
    Dc = 4,
    Dia = 5,
    Tak = 6,
    Sskn = 7,
    Gate = 8,
    Polytan = 9,
}

function get_node_site_kind(node_id: NodeID): SiteKind {
    switch (node_id.slice(-1)) {
        case "a":
            return SiteKind.A;
        case "b":
            return SiteKind.B;
    }

    throw new Error("invalid node id passed to get_node_site_kind: " + node_id);
}

export function get_node_site_layout(node_id: NodeID): SiteLayout<NodeData> {
    switch (node_id.slice(-1)) {
        case "a":
            return SITE_A_NODES;
        case "b":
            return SITE_B_NODES;
    }

    throw new Error("invalid node id passed to get_node_site_layout: " + node_id);
}

export function get_node_data(node_id: NodeID): NodeData | null {
    let layout = get_node_site_layout(node_id);

    if (!layout) {
        return null;
    }

    for (const level of layout) {
        for (const row of level) {
            for (const node of row) {
                if (node && node.id === node_id) {
                    return node;
                }
            }
        }
    }

    return null;
}

export function get_node_texture(type: number, state: NodeState): THREE.Texture {
    switch (type) {
        case NodeKind.Cou:
            switch (state) {
                case NodeState.Normal:
                    return get_texture(Texture.Cou);
                case NodeState.Active:
                    return get_texture(Texture.Cou_Active);
                case NodeState.Viewed:
                    return get_texture(Texture.Cou_Viewed);
                case NodeState.Gold:
                    return get_texture(Texture.Cou_Gold);
            }
        case NodeKind.Dc:
            switch (state) {
                case NodeState.Normal:
                    return get_texture(Texture.Dc);
                case NodeState.Active:
                    return get_texture(Texture.Dc_Active);
                case NodeState.Viewed:
                    return get_texture(Texture.Dc_Viewed);
                case NodeState.Gold:
                    return get_texture(Texture.Dc_Gold);
            }
        case NodeKind.Sskn:
            switch (state) {
                case NodeState.Normal:
                    return get_texture(Texture.Sskn);
                case NodeState.Active:
                    return get_texture(Texture.Sskn_Active);
                case NodeState.Viewed:
                    return get_texture(Texture.Sskn_Viewed);
                case NodeState.Gold:
                    return get_texture(Texture.Sskn_Gold);
            }
        case NodeKind.Tda:
            switch (state) {
                case NodeState.Normal:
                    return get_texture(Texture.Tda);
                case NodeState.Active:
                    return get_texture(Texture.Tda_Active);
                case NodeState.Viewed:
                    return get_texture(Texture.Tda_Viewed);
                case NodeState.Gold:
                    return get_texture(Texture.Tda_Gold);
            }
        case NodeKind.Dia:
            switch (state) {
                case NodeState.Normal:
                    return get_texture(Texture.Dia);
                case NodeState.Active:
                    return get_texture(Texture.Dia_Active);
                case NodeState.Viewed:
                    return get_texture(Texture.Dia_Viewed);
                case NodeState.Gold:
                    return get_texture(Texture.Dia_Gold);
            }
        case NodeKind.Lda:
            switch (state) {
                case NodeState.Normal:
                    return get_texture(Texture.Lda);
                case NodeState.Active:
                    return get_texture(Texture.Lda_Active);
                case NodeState.Viewed:
                    return get_texture(Texture.Lda_Viewed);
                case NodeState.Gold:
                    return get_texture(Texture.Lda_Gold);
            }
        default:
            switch (state) {
                case NodeState.Normal:
                    return get_texture(Texture.Generic_Node);
                case NodeState.Active:
                    return get_texture(Texture.Generic_Node_Active);
                case NodeState.Viewed:
                    return get_texture(Texture.Generic_Node_Viewed);
                case NodeState.Gold:
                    return get_texture(Texture.Generic_Node_Gold);
            }
    }
}

export function get_node_transform(node: NodeData): [Vec3, Euler] {
    const CENTER = vec3(0, 0, 0);
    const SEGMENT_COUNT = 8;
    const RADIUS = 1.3;

    const angle = ((node.position % 8) * (2 * Math.PI)) / SEGMENT_COUNT;

    // position
    const p = vec3(
        CENTER.x + RADIUS * Math.cos(angle),
        get_level_y(node.level) + -0.33 + Math.floor(node.position / 8) * 0.33,
        CENTER.z + RADIUS * Math.sin(angle)
    );

    // rotation
    const d = vec3(0, 0, 0).sub(p).normalize();
    const r_angle = -Math.atan2(d.z, d.x);
    const r = euler(0, r_angle - (Math.PI / 180) * 90, 0);

    return [p, r];
}

export function node_scale(): Vec3 {
    const scale = 0.34;
    return vec3(scale, scale / 2, scale);
}

function node_small_scale(): Vec3 {
    const scale = 0.2;
    return vec3(scale, scale / 2, scale);
}

export function create_node_mesh(node: NodeData, is_viewed: boolean): NodeMesh {
    const normal_node_texture = get_node_texture(node.type, is_viewed ? NodeState.Viewed : NodeState.Normal);
    const active_node_texture = get_node_texture(node.type, NodeState.Active);
    const gold_node_texture = get_node_texture(node.type, NodeState.Gold);

    const material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.lights,
            {
                atlas: { value: get_texture_atlas() },
                is_active: { value: false },
                is_gold: { value: false },
                active_tex_repeat: { value: active_node_texture.repeat },
                active_tex_offset: { value: active_node_texture.offset },
                normal_tex_repeat: { value: normal_node_texture.repeat },
                normal_tex_offset: { value: normal_node_texture.offset },
                gold_tex_repeat: { value: gold_node_texture.repeat },
                gold_tex_offset: { value: gold_node_texture.offset },
                bias: { value: 1 },
            },
        ]),
        vertexShader: vert_node,
        fragmentShader: frag_node,
        side: THREE.DoubleSide,
        transparent: true,
        lights: true,
    });

    const [position, rotation] = get_node_transform(node);
    const mesh = new Mesh(new THREE.PlaneGeometry(), material, {
        position,
        rotation,
        scale: node_scale(),
    });

    return mesh;
}

function get_row_precedence(row: number): [number, number, number] {
    switch (row) {
        default:
        case 0:
            return [0, 1, 2];
        case 1:
            return [1, 0, 2];
        case 2:
            return [2, 1, 0];
    }
}

function* next_pos_left([row, col]: [number, number]) {
    const p = get_row_precedence(row);

    for (let c = col - 1; c > -1; c--) for (let r = 0; r < 3; r++) yield [p[r], c];
}

function* next_pos_right([row, col]: [number, number]) {
    const p = get_row_precedence(row);

    for (let c = col + 1; c < 4; c++) for (let r = 0; r < 3; r++) yield [p[r], c];
}

function get_col_precedence(col: number): [number, number, number, number] {
    switch (col) {
        default:
        case 0:
            return [0, 1, 2, 3];
        case 1:
            return [1, 0, 2, 3];
        case 2:
            return [2, 1, 3, 0];
        case 3:
            return [3, 2, 1, 0];
    }
}

function* next_pos_up([row, col]: [number, number]) {
    const p = get_col_precedence(col);

    for (let r = row - 1; r > -1; r--) for (let c = 0; c < 4; c++) yield [r, p[c]];
}

function* next_pos_down([row, col]: [number, number]) {
    const p = get_col_precedence(col);

    for (let r = row + 1; r < 3; r++) for (let c = 0; c < 4; c++) yield [r, p[c]];
}

function get_node_matrix_row<T>(full_row: SiteRow<T>, segment: number): NodeSegmentMatrixRow<T> {
    return [
        full_row[segment],
        full_row[(segment + 3) % 8],
        full_row[(segment + 4) % 8],
        full_row[(segment + 7) % 8],
    ];
}

export function get_node_segment_matrix<T>(
    segment: number,
    level: number,
    site_layout: SiteLayout<T>
): NodeSegmentMatrix<T> {
    const [r1, r2, r3] = site_layout[level];
    return [
        get_node_matrix_row(r1, segment),
        get_node_matrix_row(r2, segment),
        get_node_matrix_row(r3, segment),
    ];
}

type MoveResult = {
    level: number;
    site_segment: number;
};

function move_on_site(direction: Direction, site_segment: number, level: number): MoveResult {
    switch (direction) {
        case Direction.Left:
            site_segment = site_segment + 1 > 7 ? 0 : site_segment + 1;
            break;
        case Direction.Right:
            site_segment = site_segment - 1 < 0 ? 7 : site_segment - 1;
            break;
        case Direction.Up:
            level++;
            break;
        case Direction.Down:
            level--;
            break;
    }

    return { site_segment, level };
}

type NodeSearchResult = {
    node: NodeData | null;
    cursor_location: CursorLocation;
    did_move: boolean;
};

export function find_next_node(
    site: SiteScene,
    direction: Direction,
    search_next: boolean
): NodeSearchResult | null {
    let next_pos: (([row, col]: [number, number]) => Generator<number[], void>)[];
    switch (direction) {
        case Direction.Left:
            next_pos = [next_pos_left, ([r]: [number, number]) => next_pos_right([r, -1])];
            break;
        case Direction.Right:
            next_pos = [next_pos_right, ([r]: [number, number]) => next_pos_left([r, 4])];
            break;
        case Direction.Up:
            next_pos = [next_pos_up, ([, c]: [number, number]) => next_pos_up([3, c])];
            break;
        case Direction.Down:
            next_pos = [next_pos_down, ([, c]: [number, number]) => next_pos_down([-1, c])];
    }

    let { cursor_location, layout: layout } = site;
    let { level, site_segment, node_matrix_position } = cursor_location;
    let { row, col } = node_matrix_position;

    const initial_node = get_node_segment_matrix(site_segment, level, layout)[row][col];

    let did_move = false;

    for (let i = 0; i < (search_next ? 2 : 1); i++) {
        if (level === get_level_count(cursor_location.site_kind) + 1 || level === -1) {
            return null;
        }

        const nodes = get_node_segment_matrix(site_segment, level, layout);

        for (const [r, c] of next_pos[i]([row, col])) {
            const node = nodes[r][c];
            if (node) {
                return {
                    node,
                    cursor_location: {
                        node_matrix_position: { row: r, col: c },
                        site_segment,
                        level,
                        site_kind: cursor_location.site_kind,
                    },
                    did_move,
                };
            }
        }

        if (!did_move) {
            ({ site_segment, level } = move_on_site(direction, site_segment, level));
            did_move = true;
        }
    }

    if (direction === Direction.Up || direction === Direction.Down || initial_node === null) {
        return {
            node: null,
            cursor_location: {
                node_matrix_position: { row, col },
                site_segment,
                level,
                site_kind: cursor_location.site_kind,
            },
            did_move,
        };
    }

    return null;
}

export function move_horizontal_and_find_next_node(
    site: SiteScene,
    direction: Direction.Left | Direction.Right
): NodeSearchResult | null {
    let next_pos: ([row, col]: [number, number]) => Generator<number[], void>;

    switch (direction) {
        case Direction.Left:
            next_pos = ([r]: [number, number]) => next_pos_right([r, -1]);
            break;
        case Direction.Right:
            next_pos = ([r]: [number, number]) => next_pos_left([r, 4]);
            break;
    }

    let { cursor_location, layout } = site;
    let { level, site_segment, node_matrix_position } = cursor_location;
    let { row, col } = node_matrix_position;

    ({ site_segment, level } = move_on_site(direction, site_segment, level));

    const nodes = get_node_segment_matrix(site_segment, level, layout);
    for (const [r, c] of next_pos([row, col])) {
        const node = nodes[r][c];
        if (node) {
            return {
                node,
                cursor_location: {
                    node_matrix_position: { row: r, col: c },
                    site_segment,
                    level,
                    site_kind: cursor_location.site_kind,
                },
                did_move: true,
            };
        }
    }

    // if we were on an unknown node currently and next node is not found we move, setting new node to unknown again
    if (site.active_node === null) {
        return {
            node: null,
            cursor_location: {
                node_matrix_position: { row, col },
                site_segment,
                level,
                site_kind: cursor_location.site_kind,
            },
            did_move: true,
        };
    }

    return null;
}

// used for finding a place to land on using level selector
export function find_first_node_on_level(
    site_layout: SiteLayout<NodeData>,
    target_level: number,
    site_segment: number
): MatrixPosition2D {
    const next_pos = ([, c]: [number, number]) => next_pos_up([3, c]);

    const nodes = get_node_segment_matrix(site_segment, target_level, site_layout);

    let [row, col] = [2, 0];
    for (const [r, c] of next_pos([row, col])) {
        const node = nodes[r][c];
        if (node) {
            return { row: r, col: c };
        }
    }

    return { row, col };
}

export function get_node<T>(cursor_location: CursorLocation, layout: SiteLayout<T>): T | null {
    const { level, node_matrix_position, site_segment } = cursor_location;
    const { row, col } = node_matrix_position;
    return get_node_matrix_row(layout[level][row], site_segment)[col];
}

export function get_node_name(cursor_location: CursorLocation, layout: SiteLayout): string {
    const node = get_node(cursor_location, layout);

    if (node) {
        return node.name;
    }

    return DEFAULT_NODE_NAME;
}

export function get_formatted_protocol_lines(node: NodeData): string[] {
    const result = node.protocol_lines.map((line) => (line === null ? "" : line));

    while (result.length < 3) {
        result.push("");
    }

    return result.slice(0, 3);
}

export type NodeDisplayText = {
    name: string;
    title: string;
    protocol_lines: string[];
};

export function get_node_display_text(
    cursor_location: CursorLocation,
    layout: SiteLayout<NodeData>
): NodeDisplayText {
    const node = get_node(cursor_location, layout);

    if (node) {
        return {
            name: node.name,
            title: node.title,
            protocol_lines: get_formatted_protocol_lines(node),
        };
    }

    return {
        name: DEFAULT_NODE_NAME,
        title: "",
        protocol_lines: ["", "", ""],
    };
}

export function reset_node(node: Node): void {
    node.mesh.visible = true;

    node.mesh.clear_animations();

    node.mesh.renderOrder = 0;

    node.mesh.set_uniform("is_gold", false);

    const [position, rotation] = get_node_transform(node);
    node.mesh.position.copy(position);
    node.mesh.rotation.copy(rotation);

    node.mesh.scale.copy(node_scale());

    node.mesh.material.depthTest = true;
}

// translates the target position based on the current node's position + site rotation.
// since we rotate the site, hardcoded positions for node animations end up in different places.
// this function takes the current rotation value into consideration and makes the hardcoded positions always
// refer to the same spot.
function adjust_target_node_position(target_position: Vec3, node: Node, angle: number): Vec3 {
    const [x, y, z] = target_position;
    return vec3(
        x * Math.cos(angle) - z * Math.sin(angle),
        get_level_y(node.level) + y,
        x * Math.sin(angle) + z * Math.cos(angle)
    );
}

function create_path_curve(target_positions: Vec3[], node: Node, angle: number): THREE.CatmullRomCurve3 {
    const curve_points = target_positions.map((p) => adjust_target_node_position(p, node, angle));
    return new THREE.CatmullRomCurve3([node.mesh.position.clone(), ...curve_points]);
}

function adjust_node_animations(node_animations: Animations[], node: Node, angle: number): Animations[] {
    return node_animations.map((a) => {
        const position_animation = a[AnimationProperty.Position];
        if (position_animation) {
            position_animation.target = adjust_target_node_position(position_animation.target, node, angle);
        }

        return a;
    });
}

export function get_node_throw_animations(node: Node, angle: number): Animations[] {
    return adjust_node_animations(
        [
            {
                [AnimationProperty.CurvedPosition]: {
                    target_curve: create_path_curve(
                        [vec3(0.9, -0.07, 0.3), vec3(0.28, -0.07, 0.77)],
                        node,
                        angle
                    ),
                    speed: 0.8,
                },
                [AnimationProperty.Scale]: {
                    delay: 500,
                    target: node_small_scale(),
                    speed: 0.5,
                },
            },
            {
                delay: 1450,
                [AnimationProperty.Position]: {
                    target: vec3(0.35, -0.07, 0.77),
                    speed: 0.15,
                },
            },
            {
                [AnimationProperty.Position]: {
                    target: vec3(-0.3, 0.03, 5),
                    speed: 3,
                },
            },
        ],
        node,
        angle
    );
}

export function get_node_rip_animations(node: Node, angle: number): Animations[] {
    return adjust_node_animations(
        [
            {
                [AnimationProperty.CurvedPosition]: {
                    target_curve: create_path_curve(
                        [vec3(0.9, -0.07, 0.3), vec3(0.28, -0.07, 0.77)],
                        node,
                        angle
                    ),
                    speed: 0.8,
                },
                [AnimationProperty.Scale]: {
                    delay: 500,
                    target: node_small_scale(),
                    speed: 0.5,
                },
            },
            {
                delay: 200,
                [AnimationProperty.Rotation]: {
                    target: euler(node.mesh.rotation.x, node.mesh.rotation.y, -0.3),
                    speed: 0.4,
                },
            },
            {
                delay: 400,
                [AnimationProperty.Position]: {
                    target: vec3(0, -0.17, 0.77),
                    speed: 0.5,
                },
            },
            {
                [AnimationProperty.Scale]: {
                    target: vec3(0, 0, 0),
                    speed: 0.4,
                },
            },
        ],
        node,
        angle
    );
}

export function get_node_explode_animations(node: Node, angle: number): Animations[] {
    return adjust_node_animations(
        [
            {
                [AnimationProperty.CurvedPosition]: {
                    target_curve: create_path_curve(
                        [vec3(-0.9, -0.07, 0.3), vec3(-0.35, -0.12, 0.77)],
                        node,
                        angle
                    ),
                    speed: 0.8,
                },
                [AnimationProperty.Scale]: {
                    delay: 500,
                    target: node_small_scale(),
                    speed: 0.5,
                },
            },

            {
                [AnimationProperty.Rotation]: {
                    target: euler(1, angle, 0),
                    speed: 1,
                },
            },
        ],
        node,
        angle
    );
}

export function get_node_knock_and_fall_animations(node: Node, angle: number): Animations[] {
    return adjust_node_animations(
        [
            {
                [AnimationProperty.CurvedPosition]: {
                    target_curve: create_path_curve(
                        [vec3(1, -0.07, 0.3), vec3(0.8, -0.57, 0.3)],
                        node,
                        angle
                    ),
                    speed: 1,
                },
                [AnimationProperty.Scale]: {
                    delay: 500,
                    target: node_small_scale(),
                    speed: 0.5,
                },
            },
        ],
        node,
        angle
    );
}

export function get_node_knock_animations(node: Node, angle: number): Animations[] {
    const curve = create_path_curve([vec3(1, -0.07, 0.3), vec3(0.8, -0.57, 0.3)], node, angle);
    return adjust_node_animations(
        [
            {
                [AnimationProperty.CurvedPosition]: {
                    target_curve: curve,
                    speed: 1,
                },
                [AnimationProperty.Scale]: {
                    delay: 500,
                    target: node_small_scale(),
                    speed: 0.5,
                },
            },
            {
                delay: 1500,
                [AnimationProperty.CurvedPosition]: {
                    target_curve: curve,
                    speed: 1.5,
                    reversed: true,
                    progress_on_curve: 1,
                },
                [AnimationProperty.Scale]: {
                    delay: 500,
                    target: node_scale(),
                    speed: 0.5,
                },
            },
        ],
        node,
        angle
    );
}

export function is_node_viewed(node_id: NodeID, progress: Progress): boolean {
    return progress.viewed_nodes.has(node_id);
}

export function is_node_visible(node_data: NodeData, progress: Progress): boolean {
    const { viewed_nodes, final_video_view_count } = progress;
    switch (node_data.type) {
        case NodeKind.Sskn:
        case NodeKind.Gate:
        case NodeKind.Polytan:
            return !viewed_nodes.has(node_data.id);
        default:
            if (node_data.unlocked_by !== null && !viewed_nodes.has(node_data.unlocked_by)) {
                return false;
            }

            if (node_data.required_final_video_viewcount === 0) {
                return true;
            }

            if (final_video_view_count === 0) {
                return false;
            }

            return final_video_view_count >= node_data.required_final_video_viewcount;
    }
}

export function is_node_media_file_audio_only(media_file: string): boolean {
    return media_file.includes("XA");
}

type ThickLineParameters = {
    position: Vec3;
    rotation: Euler;
    scale: Vec3;
};

class ThickLine extends Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> {
    constructor(
        c1: THREE.ColorRepresentation,
        c2: THREE.ColorRepresentation,
        parameters: ThickLineParameters
    ) {
        super(
            new THREE.PlaneGeometry(1, 1, 1, 128),
            new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.merge([
                    {
                        color1: { value: new THREE.Color(c1) },
                        color2: { value: new THREE.Color(c2) },
                        alpha: { value: 0.4 },
                    },
                ]),
                vertexShader: vert_thick_line,
                fragmentShader: frag_thick_line,
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
            }),
            {
                ...parameters,
            }
        );
    }
}

type NodeLinesParameters = {
    position: Vec3;
    line_count: number;
    total_frame_count: number;
    colors: THREE.ColorRepresentation[];
    line_length_range: [number, number];
    visible: boolean;
};

export class NodeLines extends Group {
    last_frame_change_time: number;
    line_count: number;
    total_frame_count: number;
    current_frame: number;
    colors: THREE.ColorRepresentation[];
    min_line_length: number;
    max_line_length: number;

    constructor(parameters: NodeLinesParameters) {
        const { position, line_count, total_frame_count, colors, line_length_range, visible } = parameters;

        super({
            position,
            visible,
        });

        this.last_frame_change_time = -1;
        this.line_count = line_count;
        this.total_frame_count = total_frame_count;
        this.current_frame = -1;
        this.colors = colors;
        this.min_line_length = line_length_range[0];
        this.max_line_length = line_length_range[1];

        this.change_frame(-1);
    }

    change_frame(time: number): void {
        this.children.forEach((c) => c.removeFromParent());

        for (let i = 0; i < this.line_count; i++) {
            const line_length = random_between(this.min_line_length, this.max_line_length);
            const color = random_from(this.colors);

            const rotation = random_rotation(0, Math.PI / 6, Math.PI / 8, Math.PI / 16, 0, Math.PI * 2.5);

            const rot_mat = new THREE.Matrix4().makeRotationFromEuler(rotation);
            const direction = new THREE.Vector3(1, 0, 0).applyMatrix4(rot_mat);
            const offset = direction.multiplyScalar(line_length / 2);

            this.add(
                new ThickLine(color, color, {
                    position: vec3(offset.x, offset.y, offset.z),
                    rotation: rotation,
                    scale: vec3(line_length, 0.008, 0),
                })
            );
        }

        this.current_frame++;
        this.last_frame_change_time = time;
    }

    update(time: number): void {
        if (this.current_frame > this.total_frame_count) {
            return;
        }

        if (this.current_frame === this.total_frame_count) {
            this.children.forEach((c) => c.removeFromParent());
            return;
        }

        const frame_gap = 100;
        if (time >= this.last_frame_change_time + frame_gap) {
            this.change_frame(time);
        }
    }
}

export class NodeRip extends Group {
    parts: Mesh<THREE.ConeGeometry, THREE.ShaderMaterial>[];
    lines: NodeLines;

    constructor(node: Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>) {
        const part_scale = 0.03;

        const material = node.material.clone();

        const parts = [];
        for (let i = 0; i < 4; i++) {
            parts.push(
                new Mesh(new THREE.ConeGeometry(1, 4, 3), material, {
                    scale: vec3(part_scale, part_scale, part_scale),
                })
            );
        }

        const wrap_part = (p: Mesh, rot_z: number, pos_y: number) =>
            new Group({
                children: [p],
                rotation: euler(Math.PI / 2, 0, rot_z),
                position: vec3(0, pos_y, -1),
            });

        const [p1, p2, p3, p4] = parts;

        const lines = new NodeLines({
            position: vec3(0, -0.18, -2.4),
            line_count: 10,
            total_frame_count: 3,
            colors: [NODE_RED_LINE_COLOR, NODE_YELLOW_LINE_COLOR],
            line_length_range: [0.5, 0.7],
            visible: true,
        });

        super({
            children: [
                wrap_part(p1, 1, -0.1),
                wrap_part(p2, 0.2, -0.09),
                wrap_part(p3, -0.2, -0.07),
                wrap_part(p4, -1, -0.11),
                lines,
            ],
        });

        this.parts = parts;

        this.lines = lines;

        play_audio(SFX.SND_13);
        play_audio(SFX.SND_15);
    }

    update(time_ctx: TimeContext): void {
        const { delta, time } = time_ctx;

        this.parts.forEach((p) => {
            p.position.y += delta;
            update_node_bias_uniform(p, time);
        });

        this.lines.update(time);
    }
}

export class NodeExplode extends Group {
    gold_node: GLBModel;
    lines: NodeLines;
    show_lines: boolean;

    constructor(node: Mesh) {
        const lines = new NodeLines({
            position: vec3(-0.35, -0.14, -2.4),
            line_count: 5,
            total_frame_count: 7,
            colors: [NODE_RED_LINE_COLOR, NODE_YELLOW_LINE_COLOR, NODE_ORANGE_LINE_COLOR],
            line_length_range: [0.8, 1.0],
            visible: false,
        });

        const gold_node_material = node.material.clone();
        gold_node_material.side = THREE.FrontSide;

        // TODO: the positioning on this is fairly innacurate.
        // the model itself is unnecessary and can be done with just BoxGeometry with modified UVs.
        const gold_node = new GLBModel(ModelKind.GoldNode, gold_node_material, {});

        const world_position = vec3();
        node.getWorldPosition(world_position);
        gold_node.position.copy(world_position);
        gold_node.position.z -= 0.05;
        gold_node.position.x += 0.02;

        gold_node.rotation.set(Math.PI / 2, 0, -1.18);

        const bbox = get_bounding_box(gold_node);
        const original_size = new THREE.Vector3();
        bbox.getSize(original_size);

        const scale_x = node.scale.x / original_size.x;
        const scale_y = node.scale.y / original_size.y;

        gold_node.scale.set(scale_x, scale_y, scale_x);

        super({
            children: [lines, gold_node],
        });

        this.lines = lines;
        this.gold_node = gold_node;
        this.show_lines = false;
    }

    update(time_ctx: TimeContext): void {
        const { time, delta } = time_ctx;

        if (this.show_lines) {
            if (!this.lines.visible) {
                this.lines.visible = true;
            }

            this.lines.update(time);
        }

        this.gold_node.set_uniform("bias", get_node_bias(time));

        this.gold_node.rotation.y -= delta * 2;
        this.gold_node.rotation.z += delta * 2;
    }

    dispose() {
        this.removeFromParent();
    }
}

let NODE_ACTIVATION_TIME = 0;

function get_node_bias(time: number): number {
    const elapsed_time = time - NODE_ACTIVATION_TIME;
    const normalized_time = (elapsed_time % 3000) / 1500.0;
    return 1.0 - normalized_time - Math.floor(1.0 - normalized_time);
}

export function update_node_bias_uniform<M extends THREE.BufferGeometry>(
    node_mesh: Mesh<M, THREE.ShaderMaterial>,
    time: number
): void {
    node_mesh.set_uniform("bias", get_node_bias(time));
}

export function activate_node<M extends THREE.BufferGeometry>(
    node_mesh: Mesh<M, THREE.ShaderMaterial>,
    time: number
): void {
    node_mesh.set_uniform("is_active", true);
    NODE_ACTIVATION_TIME = time;
}

export function deactivate_node<M extends THREE.BufferGeometry>(
    node_mesh: Mesh<M, THREE.ShaderMaterial>
): void {
    node_mesh.set_uniform("is_active", false);
}

export function set_node_as_viewed(node_id: NodeID, game_state: GameState): void {
    game_state.progress.viewed_nodes.add(node_id);
    save_state(game_state);
}

function get_row_for_node(node: NodeData): number {
    const position = node.position;

    if (position >= 0 && position <= 7) {
        return 2;
    }

    if (position >= 8 && position <= 15) {
        return 1;
    }

    return 0;
}

function get_segment_for_node_at_col(node: NodeData, col: number): number {
    for (let segment = 0; segment < 8; segment++) {
        const segment_matrix = get_node_segment_matrix(segment, node.level, get_node_site_layout(node.id));

        if (segment_matrix.find((row) => row[col]?.id === node.id)) {
            return segment;
        }
    }

    throw new Error(`failed to find segment for node ${node.id} at col ${col}`);
}

export type WordSearchResult = {
    node: NodeData;
    cursor_location: CursorLocation;
};

export function find_next_node_via_word(starting_node: NodeData, word: string): WordSearchResult {
    const layout = get_node_site_layout(starting_node.id);

    const nodes_with_same_words = [];
    for (const level of layout) {
        for (const row of level) {
            for (const node of row) {
                if (node && node.words.includes(word)) {
                    nodes_with_same_words.push(node);
                }
            }
        }
    }

    nodes_with_same_words.sort((a, b) => (a.name > b.name ? 1 : -1));

    const index = nodes_with_same_words.findIndex((node) => node.name === starting_node.name) + 1;

    const node = nodes_with_same_words[index] ?? nodes_with_same_words[0];
    const target_col = 0;

    return {
        node,
        cursor_location: {
            node_matrix_position: { row: get_row_for_node(node), col: target_col },
            level: node.level,
            site_segment: get_segment_for_node_at_col(node, target_col),
            site_kind: get_node_site_kind(node.id),
        },
    };
}
