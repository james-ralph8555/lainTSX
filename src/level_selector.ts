import * as THREE from "three";
import { TimeContext, get_texture } from "./engine";
import { secs_to_ms, split_digits, vec3 } from "./util";
import { Direction } from "./site";
import { Group, Mesh, Sprite3D, Vec3 } from "./objects";
import { Texture } from "./textures";

const VERTICAL_SPEED = 3.2;
const HORIZONTAL_SPEED = 4.2;
const VERTICAL_OPEN_POS = vec3(0.6, -0.3, -0.8);
const VERTICAL_CLOSED_POS = vec3(0.6, -1.5, -0.8);
const HORIZONTAL_OPEN_POS = vec3(-0.2, 0, -0.8);
const HORIZONTAL_CLOSED_POS = vec3(-2, 0, -0.8);

const ATLAS_W = 237;
const ATLAS_H = 32;
const DIGIT_W = ATLAS_W / 10;

function create_digit_geometry(digit: number): THREE.PlaneGeometry {
    const geometry = new THREE.PlaneGeometry();

    const x = DIGIT_W * digit;

    const uv_attr = geometry.attributes.uv;

    for (let i = 0; i < uv_attr.count; i++) {
        let u = uv_attr.getX(i);

        u = (u * DIGIT_W) / ATLAS_W + x / ATLAS_W;

        uv_attr.setX(i, u);
    }

    uv_attr.needsUpdate = true;

    return geometry;
}

function create_digit_mesh(digit: number, scale: number, position: Vec3): Mesh<THREE.PlaneGeometry> {
    const font_atlas = get_texture(Texture.Select_Level_Font);

    const geometry = create_digit_geometry(digit);

    const material = new THREE.MeshBasicMaterial({
        map: font_atlas,
        transparent: true,
        depthTest: false,
    });

    const mesh = new Mesh(geometry, material, {
        scale: vec3(DIGIT_W * scale, ATLAS_H * scale, 0),
        position,
        render_order: 1000,
    });

    return mesh;
}

class LevelSelectorArrow extends Sprite3D {
    direction: Direction.Up | Direction.Down;
    active: boolean;
    prev_activation_time: number;

    constructor(direction: Direction.Up | Direction.Down) {
        switch (direction) {
            case Direction.Up:
                super(Texture.Select_Level_Up_Arrow_Inactive, {
                    scale_factor: 4,
                });

                this.position.set(-0.22, 0.45, 0);
                break;
            case Direction.Down:
                super(Texture.Select_Level_Down_Arrow_Inactive, {
                    scale_factor: 4,
                });

                this.position.set(-0.22, 0.2, 0);
                break;
            default:
                throw new Error("invalid direction passed to level selector arrow");
        }

        this.active = false;
        this.prev_activation_time = 0;

        this.direction = direction;

        this.renderOrder = 1000;
        this.material.depthTest = false;
    }

    activate(time: number): void {
        this.prev_activation_time = time;
        this.active = true;

        switch (this.direction) {
            case Direction.Up:
                this.set_texture(Texture.Select_Level_Up_Arrow_Active);
                break;
            case Direction.Down: {
                this.set_texture(Texture.Select_Level_Down_Arrow_Active);
            }
        }
    }

    deactivate(): void {
        this.active = false;

        switch (this.direction) {
            case Direction.Up: {
                this.set_texture(Texture.Select_Level_Up_Arrow_Inactive);
                break;
            }
            case Direction.Down: {
                this.set_texture(Texture.Select_Level_Down_Arrow_Inactive);
                break;
            }
        }
    }

    update(time: number): void {
        if (this.active && time >= this.prev_activation_time + secs_to_ms(0.1)) {
            this.deactivate();
        }
    }
}

export class LevelSelector extends Group {
    is_open: boolean;
    vertical_bar_group: Group;
    horizontal_bar: Sprite3D;
    selected_level: number;
    digits: [Mesh<THREE.PlaneGeometry>, Mesh<THREE.PlaneGeometry>];
    up_arrow: LevelSelectorArrow;
    down_arrow: LevelSelectorArrow;
    max_level: number;

    constructor(selected_level: number, max_level: number) {
        super({ position: vec3(0, 0, -0.529) });

        this.is_open = false;

        this.horizontal_bar = new Sprite3D(Texture.Select_Level_Hud_Horizontal, {
            scale_factor: 5,
            position: HORIZONTAL_CLOSED_POS,
        });

        const [d1_num, d2_num] = split_digits(selected_level);
        this.digits = [
            create_digit_mesh(d1_num, 0.004, vec3(-0.26, 0.3, 0)),
            create_digit_mesh(d2_num, 0.004, vec3(-0.18, 0.3, 0)),
        ];

        this.selected_level = selected_level;
        this.max_level = max_level;

        this.down_arrow = new LevelSelectorArrow(Direction.Down);
        this.up_arrow = new LevelSelectorArrow(Direction.Up);

        this.vertical_bar_group = new Group({
            position: VERTICAL_CLOSED_POS,
            children: [
                new Sprite3D(Texture.Select_Level_Hud_Vertical, {
                    scale_factor: 4,
                    position: vec3(-0.22, 0.15, 0),
                    depth_test: false,
                    render_order: 999,
                }),
                new Sprite3D(Texture.Select_Level_Text, {
                    scale_factor: 4,
                    position: vec3(-0.22, 0.4, 0),
                    render_order: 999,
                }),
                this.up_arrow,
                this.down_arrow,
                ...this.digits,
            ],
        });

        this.add(this.vertical_bar_group, this.horizontal_bar);
    }

    update(time_ctx: TimeContext): void {
        if (this.is_open) {
            this.up_arrow.update(time_ctx.time);
            this.down_arrow.update(time_ctx.time);
        }

        this.vertical_bar_group.process_animation_queue(time_ctx);
        this.horizontal_bar.process_animation_queue(time_ctx);
    }

    open(level: number) {
        this.selected_level = level;
        this.update_digit_geometries();

        this.is_open = true;

        if (this.selected_level === this.max_level) {
            this.up_arrow.visible = false;
        }

        if (this.selected_level === 0) {
            this.down_arrow.visible = false;
        }

        this.vertical_bar_group.add_position_animation(VERTICAL_OPEN_POS, VERTICAL_SPEED);
        this.horizontal_bar.add_position_animation(HORIZONTAL_OPEN_POS, HORIZONTAL_SPEED);
    }

    close() {
        this.is_open = false;

        this.vertical_bar_group.add_position_animation(VERTICAL_CLOSED_POS, VERTICAL_SPEED);
        this.horizontal_bar.add_position_animation(HORIZONTAL_CLOSED_POS, HORIZONTAL_SPEED);
    }

    update_digit_geometries(): void {
        const [d1, d2] = split_digits(this.selected_level);
        const [d1_mesh, d2_mesh] = this.digits;

        d1_mesh.geometry = create_digit_geometry(d1);
        d2_mesh.geometry = create_digit_geometry(d2);
    }

    move_up(time: number): void {
        if (this.down_arrow.active || this.up_arrow.active || this.selected_level === this.max_level) {
            return;
        }

        this.down_arrow.visible = true;

        this.selected_level++;
        this.update_digit_geometries();
        this.up_arrow.activate(time);

        if (this.selected_level === this.max_level) {
            this.up_arrow.visible = false;
        }
    }

    move_down(time: number): void {
        if (this.down_arrow.active || this.up_arrow.active || this.selected_level === 0) {
            return;
        }

        this.up_arrow.visible = true;

        this.selected_level--;
        this.update_digit_geometries();
        this.down_arrow.activate(time);

        if (this.selected_level === 0) {
            this.down_arrow.visible = false;
        }
    }
}
