import {
    get_separate_texture,
    get_texture,
    get_texture_atlas,
    ModelKind,
    SceneKind,
    SceneUpdateContext,
    SceneUpdateResult,
    TimeContext,
} from "./engine";
import { GLBModel, Group, Mesh, Sprite3D, Vec3 } from "./objects";
import frag_left_side from "./static/shaders/gate_left_side.frag?raw";
import frag_right_side from "./static/shaders/gate_right_side.frag?raw";
import vert_side from "./static/shaders/gate_side.vert?raw";
import vert_blue_digit from "./static/shaders/blue_digit.vert?raw";
import frag_blue_digit from "./static/shaders/blue_digit.frag?raw";
import * as THREE from "three";
import { euler, secs_to_ms, vec3 } from "./util";
import { CursorLocation, SiteScene } from "./site";
import { Texture } from "./textures";
import { MediumFontText } from "./text";
import { NodeID, set_node_as_viewed } from "./node";

enum DigitKind {
    One,
    Zero,
}

class Digit extends Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> {
    kind: DigitKind;
    target_position: Vec3;
    start_time: number;

    constructor(kind: DigitKind, initial_position: Vec3, target_position: Vec3, start_time: number) {
        let texture;
        const texture_h = 8;
        let texture_w;
        switch (kind) {
            case DigitKind.One:
                texture = get_texture(Texture.Blue_Binary_One);
                texture_w = 3;
                break;
            case DigitKind.Zero:
                texture = get_texture(Texture.Blue_Binary_Zero);
                texture_w = 7;
                break;
        }

        const scale_factor = 0.008;

        super(
            new THREE.PlaneGeometry(),
            new THREE.ShaderMaterial({
                uniforms: {
                    atlas: { value: get_texture_atlas() },
                    tex_repeat: { value: texture.repeat },
                    tex_offset: { value: texture.offset },
                    brightness: { value: 1.0 },
                },
                vertexShader: vert_blue_digit,
                fragmentShader: frag_blue_digit,
                depthTest: false,
            }),
            {
                scale: vec3(scale_factor * texture_w, texture_h * scale_factor, 0),
                position: initial_position,
                visible: false,
            }
        );

        this.kind = kind;
        this.target_position = target_position;
        this.start_time = start_time;
    }

    update(time_ctx: TimeContext): boolean {
        const { time, delta } = time_ctx;

        if (time >= this.start_time) {
            if (!this.visible) {
                this.visible = true;
            }

            return this.position_towards(this.target_position, delta * 15);
        }

        return false;
    }
}

function create_digits(time: number): Digit[] {
    const z = (initial_position: Vec3, final_position: Vec3, start_time: number): Digit => {
        return new Digit(DigitKind.Zero, initial_position, final_position, start_time);
    };

    const o = (initial_position: Vec3, final_position: Vec3, start_time: number): Digit => {
        return new Digit(DigitKind.One, initial_position, final_position, start_time);
    };

    const xs = [0.5, 0.57, 0.63, 0.68];
    const y_gap = 0.065;
    const starting_y = 0.1;

    return [
        z(vec3(1.0, 0.8, 0), vec3(xs[0], starting_y - y_gap, 0), time + 50),
        z(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap, 0), time + 100),
        o(vec3(-1.0, 0.8, 0), vec3(xs[2], starting_y - y_gap, 0), time + 1200),
        o(vec3(-1.0, 0.8, 0), vec3(xs[3], starting_y - y_gap, 0), time + 150),

        o(vec3(1.0, 0.8, 0), vec3(xs[0], starting_y - y_gap * 2, 0), time + 600),
        z(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap * 2, 0), time + 500),
        o(vec3(1.0, 0.8, 0), vec3(xs[2], starting_y - y_gap * 2, 0), time + 400),
        z(vec3(1.0, 0.8, 0), vec3(xs[3], starting_y - y_gap * 2, 0), time + 300),

        z(vec3(1.0, 0.8, 0), vec3(xs[0], starting_y - y_gap * 3, 0), time + 150),
        z(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap * 3, 0), time + 900),
        o(vec3(-1.0, 0.6, 0), vec3(xs[2], starting_y - y_gap * 3, 0), time + 50),
        o(vec3(1.0, 0.8, 0), vec3(xs[3], starting_y - y_gap * 3, 0), time + 250),

        o(vec3(1.0, 0.4, 0), vec3(xs[0], starting_y - y_gap * 4, 0), time + 200),
        z(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap * 4, 0), time + 200),
        o(vec3(1.0, 0.3, 0), vec3(xs[2], starting_y - y_gap * 4, 0), time + 300),
        o(vec3(-1.0, 0.8, 0), vec3(xs[3], starting_y - y_gap * 4, 0), time + 400),

        o(vec3(1.0, 0.4, 0), vec3(xs[0], starting_y - y_gap * 5, 0), time + 650),
        o(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap * 5, 0), time + 400),
        z(vec3(-1.0, 0.4, 0), vec3(xs[2], starting_y - y_gap * 5, 0), time + 300),
        o(vec3(1.0, 0.3, 0), vec3(xs[3], starting_y - y_gap * 5, 0), time + 1000),

        z(vec3(1.0, 0.4, 0), vec3(xs[0], starting_y - y_gap * 6, 0), time + 800),
        z(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap * 6, 0), time + 700),
        o(vec3(-1.0, 0.4, 0), vec3(xs[2], starting_y - y_gap * 6, 0), time + 600),
        z(vec3(1.0, -0.3, 0), vec3(xs[3], starting_y - y_gap * 6, 0), time + 500),

        z(vec3(1.0, 0.4, 0), vec3(xs[0], starting_y - y_gap * 7, 0), time + 900),
        o(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap * 7, 0), time + 800),
        o(vec3(-1.0, -0.4, 0), vec3(xs[2], starting_y - y_gap * 7, 0), time + 700),
        o(vec3(1.0, 0.3, 0), vec3(xs[3], starting_y - y_gap * 7, 0), time + 600),

        z(vec3(1.0, 0.4, 0), vec3(xs[0], starting_y - y_gap * 8, 0), time + 300),
        o(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap * 8, 0), time + 1100),
        o(vec3(-1.0, -0.4, 0), vec3(xs[2], starting_y - y_gap * 8, 0), time + 700),
        o(vec3(1.0, 0.3, 0), vec3(xs[3], starting_y - y_gap * 8, 0), time + 900),

        o(vec3(-1.0, 0.2, 0), vec3(xs[0], starting_y - y_gap * 9, 0), time + 500),
        z(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap * 9, 0), time + 300),
        z(vec3(1.0, 0.8, 0), vec3(xs[2], starting_y - y_gap * 9, 0), time + 800),
        z(vec3(1.0, 0.3, 0), vec3(xs[3], starting_y - y_gap * 9, 0), time + 900),

        o(vec3(1.0, -0.4, 0), vec3(xs[0], starting_y - y_gap * 10, 0), time + 1000),
        o(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap * 10, 0), time + 900),
        o(vec3(-1.0, 0.8, 0), vec3(xs[2], starting_y - y_gap * 10, 0), time + 400),
        o(vec3(-1.0, -0.4, 0), vec3(xs[3], starting_y - y_gap * 10, 0), time + 500),

        z(vec3(1.0, -0.4, 0), vec3(xs[0], starting_y - y_gap * 11, 0), time + 400),
        o(vec3(1.0, 0.8, 0), vec3(xs[1], starting_y - y_gap * 11, 0), time + 1000),
        o(vec3(-1.0, 0.8, 0), vec3(xs[2], starting_y - y_gap * 11, 0), time + 900),
        z(vec3(-1.0, -0.4, 0), vec3(xs[3], starting_y - y_gap * 11, 0), time + 1100),
    ];
}

function create_mirrors(gate_level: number): GLBModel[] {
    const mirrors = [];

    const texture = get_separate_texture(Texture.Gate_Mirror);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    for (let i = 0; i < 4; i++) {
        const center = vec3(0, 0, 0);
        const segment_count = 4;
        const radius = 0.125;
        const angle = (i * 2 * Math.PI) / segment_count;
        const position = vec3(center.x + radius * Math.cos(angle), 0, center.z + radius * Math.sin(angle));

        const d = vec3(0, 0, 0).sub(position).normalize();

        const mirror_scale = 0.06;
        const mirror = new GLBModel(ModelKind.Mirror, new THREE.MeshBasicMaterial({}), {
            scale: vec3(mirror_scale, mirror_scale, mirror_scale),
            position,
            rotation: euler(0, -Math.atan2(d.z, d.x), 0),
        });

        // TODO: closer imitate effect from original game
        mirror.set_existing_texture(texture);

        mirror.visible = false;

        mirrors.push(mirror);
    }

    for (let i = 0; i < gate_level - 1; i++) {
        mirrors[i].visible = true;
    }

    return mirrors;
}

export class GateScene extends THREE.Scene {
    scene_kind: SceneKind.Gate;
    last_side_update_time: number;
    left_side: Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    right_side: Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    all_digits_in_place: boolean;
    digit_group_in_place: boolean;
    digits: Digit[];
    digit_group: Group;
    later_objects_display_time: number;
    later_objects: THREE.Group;
    mirrors: GLBModel[];
    mirror_group: THREE.Group;
    last_press_any_button_blink_time: number;
    press_any_button_group: THREE.Group;
    level: number;
    enter_location: CursorLocation;
    node_id: NodeID;

    constructor(enter_time: number, gate_level: number, enter_location: CursorLocation, node_id: NodeID) {
        super();

        this.node_id = node_id;

        if (gate_level > 4 || gate_level < 1) {
            throw new Error("incorrect gate level value");
        }

        this.scene_kind = SceneKind.Gate;
        this.level = gate_level;
        this.enter_location = enter_location;

        this.last_side_update_time = -1;
        const side_scale = 4;

        const binary_texture = get_texture(Texture.Blue_Binary);

        this.left_side = new Mesh(
            new THREE.PlaneGeometry(),
            new THREE.ShaderMaterial({
                uniforms: {
                    atlas: { value: get_texture_atlas() },
                    tex_repeat: { value: binary_texture.repeat },
                    tex_offset: { value: binary_texture.offset },
                    offset: { value: 0 },
                },
                vertexShader: vert_side,
                fragmentShader: frag_left_side,
            }),
            {
                scale: vec3(side_scale, side_scale / 2, 0),
                position: vec3(-1.1, 0, -0.4),
                rotation: euler(0, Math.PI / 6, 0),
            }
        );

        this.right_side = new Mesh(
            new THREE.PlaneGeometry(),
            new THREE.ShaderMaterial({
                uniforms: {
                    atlas: { value: get_texture_atlas() },
                    tex_repeat: { value: binary_texture.repeat },
                    tex_offset: { value: binary_texture.offset },
                    offset: { value: 0 },
                },
                vertexShader: vert_side,
                fragmentShader: frag_right_side,
                side: THREE.DoubleSide,
            }),
            {
                scale: vec3(side_scale, side_scale / 2, 0),
                position: vec3(1.1, 0, -0.4),
                rotation: euler(0, -Math.PI / 6, 0),
            }
        );

        this.all_digits_in_place = false;
        this.digits = create_digits(enter_time);

        this.digit_group_in_place = false;
        this.digit_group = new Group({ position: vec3(0, 0, -1), children: [...this.digits] });

        this.mirrors = create_mirrors(gate_level);
        this.mirror_group = new Group({ children: [...this.mirrors] });

        this.last_press_any_button_blink_time = -1;
        this.press_any_button_group = new Group({
            children: [
                new MediumFontText("press ANY  button", 4.5, vec3(-0.268, -0.427, 0), 0xfab005),
                new MediumFontText("press ANY  button", 4.5, vec3(-0.27, -0.425, 0), 0xfac505),
            ],
        });

        this.later_objects_display_time = Infinity;
        this.later_objects = new Group({
            visible: false,
            position: vec3(0, 0, -1),
            children: [this.press_any_button_group],
        });

        if (gate_level === 4) {
            this.later_objects.add(
                new Sprite3D(Texture.You_Got_An_Access_Pass, {
                    scale_factor: 4.2,
                    position: vec3(0, -0.3, 0),
                }),
                new Sprite3D(Texture.Change_Site_Enable, {
                    scale_factor: 4.2,
                    position: vec3(0, 0.3, 0),
                }),
                new Sprite3D(Texture.Gate_Pass_Underline, {
                    scale_factor: 4.2,
                    position: vec3(0, 0.27, 0),
                }),
                new Sprite3D(Texture.Left_Gate_Thing, {
                    scale_factor: 4.2,
                    position: vec3(-0.27, -0.3, 0),
                }),
                new Sprite3D(Texture.Right_Gate_Thing, {
                    scale_factor: 4.2,
                    position: vec3(0.27, -0.3, 0),
                })
            );
        }

        this.add(
            new Group({
                position: vec3(0, 0, -1),
                children: [
                    this.mirror_group,
                    this.digit_group,
                    this.right_side,
                    this.left_side,
                    new Sprite3D(Texture.Gate_Pass, {
                        scale_factor: 4.2,
                        position: vec3(0, 0.39, 0),
                    }),
                    new Sprite3D(Texture.Gate_Pass_Underline, {
                        scale_factor: 4.2,
                        position: vec3(0, 0.35, 0),
                    }),
                    new THREE.PointLight(0xffffff, 5.2),
                ],
            }),
            this.later_objects
        );
    }
}

export function update_gate_scene(gate: GateScene, ctx: SceneUpdateContext): SceneUpdateResult {
    const { time_ctx, key_states, game_state, camera } = ctx;
    const { progress } = game_state;
    const { time, delta } = time_ctx;

    if (gate.later_objects.visible) {
        for (const k of key_states) {
            if (k) {
                set_node_as_viewed(gate.node_id, game_state);

                return {
                    new_scene: new SiteScene(progress, gate.enter_location, time, camera),
                };
            }
        }
    }

    if (time >= gate.last_side_update_time + 40) {
        switch (gate.left_side.position.y) {
            case 0.0:
                gate.left_side.position.y = 0.2;
                break;
            case 0.1:
                gate.left_side.position.y = 0.0;
                break;
            case 0.2:
                gate.left_side.position.y = 0.1;
                break;
        }

        switch (gate.right_side.position.y) {
            case 0.0:
                gate.right_side.position.y = 0.2;
                break;
            case 0.1:
                gate.right_side.position.y = 0.0;
                break;
            case 0.2:
                gate.right_side.position.y = 0.1;
                break;
        }
        gate.last_side_update_time = time;
    }

    let all_digits_in_place = true;
    gate.digits.forEach((digit) => {
        const done_animating = digit.update(time_ctx);
        if (!done_animating) {
            all_digits_in_place = false;
        }
    });

    if (all_digits_in_place) {
        if (!gate.all_digits_in_place) {
            gate.all_digits_in_place = true;
            gate.digits.forEach((digit) => {
                digit.set_uniform("brightness", 2.5);
            });
        }

        const group_done_animating = gate.digit_group.position_towards(vec3(-0.6, 0.3, -1), 0.7 * delta);

        if (!gate.digit_group_in_place && group_done_animating) {
            gate.digit_group_in_place = true;
            gate.later_objects_display_time = time + secs_to_ms(0.5);
        }
    }

    if (!gate.later_objects.visible && time >= gate.later_objects_display_time) {
        gate.later_objects.visible = true;

        gate.mirrors[gate.level - 1].visible = true;
        gate.digit_group.visible = false;
    }

    gate.mirror_group.rotation.y -= delta * 2;

    if (time >= gate.last_press_any_button_blink_time + secs_to_ms(0.5)) {
        gate.press_any_button_group.visible = !gate.press_any_button_group.visible;
        gate.last_press_any_button_blink_time = time;
    }

    gate.mirrors.forEach((mirror) => {
        mirror.offset_texture(-delta * 0.2, 0);
    });

    return {};
}
