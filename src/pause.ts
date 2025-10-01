import * as THREE from "three";
import { euler, extract_frame, vec3 } from "./util";
import { get_texture_atlas, SceneKind, SPRITE_ATLAS_DIM, TimeContext } from "./engine";
import sprite_atlas_json from "./static/json/sprite_atlas.json";
import { Texture } from "./textures";
import { Euler, Group, is_plane_in_sight, Mesh, Sprite3D, Vec3 } from "./objects";
import { BigFontColors, BigFontText, MediumFontText, OrangeGlyph, WhiteGlyph, YellowGlyph } from "./text";
import { Prompt } from "./prompt";

const ABOUT_TEXT_INITIAL_POS = vec3(0, -17, 0);

enum CellType {
    Regular,
    Glyph,
    MainGlyph,
}

// row, column
type CellPosition = {
    r: number;
    c: number;
};

const CELL_SCALE = 0.6;
const CELL_ROTATION_SPEED = 10;

function get_shadow_position(cell_position: Vec3): Vec3 {
    const shadow_offset_scale = 0.15;
    const center_x = 0;
    const center_y = 0;

    const shadow_offset_x = (center_x - cell_position.x) * shadow_offset_scale;
    const shadow_offset_y = (center_y - cell_position.y) * shadow_offset_scale;

    return vec3(shadow_offset_x, shadow_offset_y, 0);
}

class Cell extends Group {
    matrix_position: CellPosition;
    front: Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    cached_front_material: THREE.MeshBasicMaterial;
    char: string;
    cell_type: CellType;
    done_post_intro_swap: boolean;
    active: boolean;
    final_position: Vec3;
    initial_position: Vec3;
    initial_rotation: Euler;
    shadow: Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    shadow_target_world_pos: Vec3;

    constructor(r: number, c: number, type: CellType, char: string = "") {
        const render_order = 999999999;

        const initial_position = vec3(c / 5 - 0.5, (r / 5) * -1 + 1.5, -11);
        const initial_rotation = euler(Math.PI / 6, Math.PI / 2, -1);
        let final_position = vec3(c - 3, r * -1 + 3.5, -9);

        if (c > 6) {
            const front = new Mesh(
                new THREE.PlaneGeometry(),
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0,
                    depthTest: false,
                }),
                {
                    render_order,
                    scale: vec3(CELL_SCALE, CELL_SCALE, 0),
                }
            );

            super({
                children: [front],
                position: initial_position,
                rotation: initial_rotation,
            });

            this.matrix_position = { r, c };
            this.cell_type = type;
            this.char = char;
            this.done_post_intro_swap = false;
            this.front = front;
            this.active = false;
            this.final_position = final_position;
            this.initial_position = initial_position;
            this.initial_rotation = initial_rotation;
            this.cached_front_material = front.material.clone();
            this.shadow = new Mesh(
                new THREE.PlaneGeometry(),
                new THREE.MeshBasicMaterial({ visible: false }),
                {}
            );
            this.shadow_target_world_pos = vec3();

            if (char === "i") {
                this.scale.x = CELL_SCALE * 0.8;
            }

            if (char === "g") {
                this.final_position.y -= 0.035;
            }

            return;
        }

        let c_offset = c;
        if (c_offset > 3) {
            c_offset = 6 - c;
        }

        let r_offset = r;
        if (r_offset > 3) {
            r_offset = 6 - r;
        }

        const cell_w = 16;
        const cell_h = 16;
        const unique_cells_per_row = 4;

        const square_map = extract_frame(
            get_texture_atlas(),
            SPRITE_ATLAS_DIM,
            SPRITE_ATLAS_DIM,
            sprite_atlas_json[Texture.Pause_Gray_Boxes].x +
                r_offset * unique_cells_per_row * cell_w +
                c_offset * cell_w,
            sprite_atlas_json[Texture.Pause_Gray_Boxes].y,
            cell_w,
            cell_h
        );

        const front = new Mesh(
            new THREE.PlaneGeometry(),
            new THREE.MeshBasicMaterial({
                side: THREE.FrontSide,
                map: square_map,
                depthTest: false,
                transparent: true,
            }),
            {
                render_order,
                scale: vec3(CELL_SCALE, CELL_SCALE, 0),
            }
        );

        let back;
        if (char && type === CellType.MainGlyph) {
            const { material, geometry } = new WhiteGlyph(char, 1);

            back = new Mesh(
                geometry,
                new THREE.MeshBasicMaterial({
                    side: THREE.BackSide,
                    map: material.map,
                    depthTest: false,
                    transparent: true,
                }),
                {
                    render_order,
                    scale: vec3(CELL_SCALE, CELL_SCALE, 0),
                }
            );
        } else {
            back = new Mesh(
                new THREE.PlaneGeometry(),
                new THREE.MeshBasicMaterial({
                    side: THREE.BackSide,
                    map: square_map,
                    depthTest: false,
                    transparent: true,
                }),
                {
                    render_order,
                    scale: vec3(CELL_SCALE, CELL_SCALE, 0),
                }
            );
        }

        front.flip_texture(c > 3, r > 2);

        if (type !== CellType.MainGlyph) {
            back.flip_texture(c < 3, r > 2);
        } else {
            back.flip_texture(true, false);
        }

        const shadow = new Mesh(
            new THREE.PlaneGeometry(),
            new THREE.MeshBasicMaterial({
                color: 0x48486b,
                side: THREE.DoubleSide,
                depthTest: false,
                transparent: true,
            }),
            {
                render_order: render_order - 1,
                scale: vec3(CELL_SCALE, CELL_SCALE, 0),
                position: get_shadow_position(final_position),
            }
        );

        super({
            children: [front, back, shadow],
            position: initial_position,
            rotation: initial_rotation,
        });

        this.cell_type = type;
        this.front = front;
        this.char = char;
        this.done_post_intro_swap = false;
        this.active = false;
        this.final_position = final_position;
        this.initial_position = initial_position;
        this.initial_rotation = initial_rotation;
        this.cached_front_material = front.material.clone();
        this.shadow = shadow;
        this.shadow_target_world_pos = vec3();

        this.matrix_position = { r, c };
    }

    update_shadow_target_world_pos(): void {
        this.shadow.getWorldPosition(this.shadow_target_world_pos);
    }

    maintain_shadow_transform(): void {
        // position
        const local_position = this.worldToLocal(this.shadow_target_world_pos.clone());
        this.shadow.position.copy(local_position);

        // rotation
        const group_world_quat = new THREE.Quaternion();
        this.getWorldQuaternion(group_world_quat);

        const inverse_group_quat = group_world_quat.clone().invert();
        this.shadow.quaternion.copy(inverse_group_quat);
    }

    update(pause_menu_mode_ctx: PauseMenuModeContext, time_ctx: TimeContext, camera: THREE.Camera): boolean {
        const { r, c } = this.matrix_position;

        const { delta, time } = time_ctx;

        let is_in_final_transform = false;

        switch (pause_menu_mode_ctx.mode) {
            case PauseMenuMode.Opening_1:
                let position_done = this.position_towards(this.final_position, delta * 8);
                let rotation_done = this.rotation_towards(euler(0, 0, 0), delta * 8);

                is_in_final_transform = position_done && rotation_done;

                break;
            case PauseMenuMode.Opening_2:
                const row_count = 7;
                if (time >= pause_menu_mode_ctx.last_change_time + 100 * (row_count - r + c)) {
                    this.update_shadow_target_world_pos();

                    const speed = 8;
                    let x_rotation_done = this.rotation_x_towards(Math.PI * 2, delta * speed);
                    let y_rotation_done = this.rotation_y_towards(-Math.PI, delta * speed);

                    is_in_final_transform = x_rotation_done && y_rotation_done;

                    this.maintain_shadow_transform();
                }

                if (!this.done_post_intro_swap && is_in_final_transform) {
                    switch (this.cell_type) {
                        case CellType.Glyph:
                            {
                                const { material, geometry } = new YellowGlyph(this.char, 1);
                                this.front.material = material;
                                this.front.geometry = geometry;
                            }
                            break;
                        case CellType.MainGlyph:
                            {
                                const { material, geometry } = new OrangeGlyph(this.char, 1);
                                this.front.material = material;
                                this.front.geometry = geometry;
                            }
                            break;
                    }

                    this.done_post_intro_swap = true;
                }

                break;
            case PauseMenuMode.Closing_1:
            case PauseMenuMode.Open:
                this.update_shadow_target_world_pos();

                const target_x_rot = this.active ? Math.PI * 4 : Math.PI * 2;
                const target_y_rot = this.active ? -Math.PI * 2 : -Math.PI;

                let x_rotation_done = this.rotation_x_towards(target_x_rot, delta * CELL_ROTATION_SPEED);
                let y_rotation_done = this.rotation_y_towards(target_y_rot, delta * CELL_ROTATION_SPEED);

                is_in_final_transform = x_rotation_done && y_rotation_done;

                this.maintain_shadow_transform();

                break;
            case PauseMenuMode.Closing_2:
                {
                    if (!this.visible) {
                        return true;
                    }

                    const { r, c } = this.matrix_position;

                    const center_r = 3;
                    const center_c = 3;

                    const dir_r = center_r - r;
                    const dir_c = c - center_c;

                    const distance = Math.sqrt(dir_r * dir_r + dir_c * dir_c);
                    const norm_r = distance > 0 ? dir_r / distance : 0;
                    const norm_c = distance > 0 ? dir_c / distance : 0;

                    const expansion_distance = 10;

                    const target_pos = vec3(
                        this.position.x + norm_c * expansion_distance,
                        this.position.y + norm_r * expansion_distance,
                        -9
                    );

                    this.position_towards(target_pos, delta * distance * 7);

                    let target_rot_y = -Math.PI - Math.PI / 2;
                    if (c > 3) {
                        target_rot_y -= 0.4;
                    }

                    this.rotation_towards(
                        euler(this.rotation.x, target_rot_y, Math.PI),
                        delta * 8 * ((c + 1) / 16)
                    );

                    if (!is_plane_in_sight(this, camera)) {
                        this.visible = false;
                    }
                }
                break;
            default:
                return true;
        }

        return is_in_final_transform;
    }

    reset(): void {
        this.position.copy(this.initial_position);
        this.rotation.copy(this.initial_rotation);
        this.front.material = this.cached_front_material;
        this.front.geometry = new THREE.PlaneGeometry();

        const { r, c } = this.matrix_position;
        this.front.flip_texture(c > 3, r > 2);

        this.done_post_intro_swap = false;

        this.shadow.position.copy(get_shadow_position(this.final_position));
        this.shadow.rotation.set(0, 0, 0);
    }
}

type RegularCellDescriptor = {
    type: CellType.Regular;
};

type GlyphCellDescriptor = {
    type: CellType.Glyph | CellType.MainGlyph;
    char: string;
};

export enum PauseMenuMode {
    Opening_1,
    Opening_2,
    Open,
    Closing_1,
    Closing_2,
    Closed,
}

export enum PauseMenuItem {
    Load = 0,
    About,
    Change,
    Save,
    Exit,
    None = -1,
}

type PauseMenuModeContext = {
    mode: PauseMenuMode;
    last_change_time: number;
};

type ItemLocation = {
    start_cell: number;
    end_cell: number;
};

export class PauseMenu extends Group {
    cells: Cell[];
    mode_ctx: PauseMenuModeContext;
    previous_item: PauseMenuItem;
    current_item: PauseMenuItem;
    item_locations: ItemLocation[];
    application_version_group: Group;
    permission_denied_popup: Group;
    about: Group;
    about_text: Sprite3D;
    prompt: Prompt;

    constructor() {
        const r = (): RegularCellDescriptor => {
            return { type: CellType.Regular };
        };

        const c = (chr: string): GlyphCellDescriptor => {
            return { type: CellType.Glyph, char: chr };
        };

        const m = (chr: string): GlyphCellDescriptor => {
            return { type: CellType.MainGlyph, char: chr };
        };

        // prettier-ignore
        const layout = [
                [r(), r(), r(), r(), r(), r(), r(), null, null, null],
                [r(), m("L"), c("o"), c("a"), c("d"), r(), r(), null, null, null],
                [r(), r(), r(), r(), r(), m("A"), c("b"), c("o"), c("u"), c("t")],
                [r(), r(), r(), m("C"), c("h"), c("a"), c("n"), c("g"), c("e"), null],
                [r(), r(), r(), r(), r(), r(), r(), null, null, null],
                [r(), m("S"), c("a"), c("v"), c("e"), r(), r(), null, null, null],
                [r(), r(), r(), r(), r(), m("E"), c("x"), c("i"), c("t"), null],
        ];

        const item_locations: ItemLocation[] = [];
        let current_item_location: ItemLocation | null = null;

        const cells: Cell[] = [];
        layout.forEach((row, row_num) =>
            row.forEach((cell_descriptor, col_num) => {
                if (cell_descriptor) {
                    switch (cell_descriptor.type) {
                        case CellType.MainGlyph:
                        case CellType.Glyph:
                            if (current_item_location !== null) {
                                current_item_location.end_cell++;
                            }

                            cells.push(
                                new Cell(row_num, col_num, cell_descriptor.type, cell_descriptor.char)
                            );
                            break;
                        case CellType.Regular:
                            if (current_item_location) {
                                item_locations.push(current_item_location);
                                current_item_location = null;
                            }

                            cells.push(new Cell(row_num, col_num, cell_descriptor.type));
                            break;
                    }

                    if (cell_descriptor.type === CellType.MainGlyph) {
                        const start_cell = cells.length - 1;
                        current_item_location = { start_cell: start_cell, end_cell: start_cell + 1 };
                    }
                } else {
                    if (current_item_location) {
                        item_locations.push(current_item_location);
                        current_item_location = null;
                    }
                }
            })
        );

        cells.forEach((cell) => (cell.visible = false));

        const application_version_group = new Group({
            visible: false,
            children: [
                new MediumFontText("Application Version 1.0", 20, vec3(-1.6, -1.7, 0)),
                new Mesh(
                    new THREE.PlaneGeometry(),
                    new THREE.MeshBasicMaterial({
                        transparent: true,
                        opacity: 0.5,
                        depthTest: false,
                        color: 0x0,
                    }),
                    {
                        render_order: 9999,
                        scale: vec3(10, 2, 0),
                        position: vec3(0, -2.4, 0),
                    }
                ),
            ],
        });

        const popup_render_order = 999999999;
        const permission_denied_popup = new Group({
            children: [
                new Sprite3D(Texture.Prompt_Question_Container, {
                    scale_factor: 4.35,
                    opacity: 0.5,
                    depth_test: false,
                    render_order: popup_render_order,
                }),
                new BigFontText("Permission denied", {
                    position: vec3(-0.3, 0, 0),
                    scale_factor: 4,
                    color: BigFontColors.AllOrange,
                    extra_gap: 0.005,
                    render_order: popup_render_order,
                }),
            ],
            position: vec3(0, 0, 5.5),
            visible: false,
        });

        const about_text = new Sprite3D(Texture.About_Bg, {
            scale_factor: 18.5,
            position: ABOUT_TEXT_INITIAL_POS.clone(),
            render_order: popup_render_order + 1,
            depth_test: false,
        });

        const about_wrapper = new Group({
            children: [
                about_text,
                new Mesh(
                    new THREE.PlaneGeometry(),
                    new THREE.MeshBasicMaterial({ color: 0x0, depthTest: false, transparent: true }),
                    {
                        scale: vec3(20, 20, 20),
                        render_order: popup_render_order,
                    }
                ),
            ],
            visible: false,
        });

        const prompt = new Prompt(SceneKind.Site);
        super({
            position: vec3(0, 0, -7),
            children: [...cells, application_version_group, prompt, permission_denied_popup, about_wrapper],
        });

        this.mode_ctx = { mode: PauseMenuMode.Closed, last_change_time: -1 };
        this.cells = cells;
        this.current_item = PauseMenuItem.None;
        this.previous_item = PauseMenuItem.None;
        this.item_locations = item_locations;
        this.application_version_group = application_version_group;
        this.prompt = prompt;
        this.permission_denied_popup = permission_denied_popup;
        this.about = about_wrapper;
        this.about_text = about_text;
    }

    set_item(item: PauseMenuItem): void {
        this.previous_item = this.current_item;
        this.current_item = item;

        if (this.previous_item !== PauseMenuItem.None) {
            const { start_cell, end_cell } = this.item_locations[this.previous_item];
            const previous_cells = this.cells.slice(start_cell, end_cell);
            previous_cells.forEach((cell) => (cell.active = false));
        }

        if (this.current_item !== PauseMenuItem.None) {
            const { start_cell, end_cell } = this.item_locations[this.current_item];
            const new_cells = this.cells.slice(start_cell, end_cell);
            new_cells.forEach((cell) => (cell.active = true));
        }
    }

    set_mode(mode: PauseMenuMode, time: number): void {
        this.mode_ctx.mode = mode;
        this.mode_ctx.last_change_time = time;
    }

    is_open(): boolean {
        return this.mode_ctx.mode !== PauseMenuMode.Closed;
    }

    can_interact(): boolean {
        return this.mode_ctx.mode === PauseMenuMode.Open;
    }

    move_up(): void {
        if (this.current_item === PauseMenuItem.Load || this.current_item === PauseMenuItem.None) {
            return;
        }

        this.set_item(this.current_item - 1);
    }

    move_down(): void {
        if (this.current_item === PauseMenuItem.Exit || this.current_item === PauseMenuItem.None) {
            return;
        }

        this.set_item(this.current_item + 1);
    }

    update(time_ctx: TimeContext, camera: THREE.Camera): void {
        let all_cells_in_final_transform = true;
        for (let i = 0; i < this.cells.length; i++) {
            const is_in_final_transform = this.cells[i].update(this.mode_ctx, time_ctx, camera);
            if (!is_in_final_transform) {
                all_cells_in_final_transform = false;
            }
        }

        if (all_cells_in_final_transform) {
            switch (this.mode_ctx.mode) {
                case PauseMenuMode.Opening_1:
                    this.set_mode(PauseMenuMode.Opening_2, time_ctx.time);
                    break;
                case PauseMenuMode.Opening_2:
                    this.application_version_group.visible = true;
                    this.set_mode(PauseMenuMode.Open, time_ctx.time);
                    this.set_item(PauseMenuItem.Change);
                    break;
                case PauseMenuMode.Closing_1:
                    this.application_version_group.visible = false;
                    this.set_mode(PauseMenuMode.Closing_2, time_ctx.time);
                    break;
                case PauseMenuMode.Closing_2:
                    this.set_mode(PauseMenuMode.Closed, time_ctx.time);
                    break;
            }
        }

        if (this.about.visible) {
            this.about_text.position.y += time_ctx.delta;
        }
    }

    open(time: number): void {
        this.set_mode(PauseMenuMode.Opening_1, time);
        this.cells.forEach((c) => c.reset());
        this.cells.forEach((c) => (c.visible = true));
    }

    reset(): void {
        this.mode_ctx = { mode: PauseMenuMode.Closed, last_change_time: -1 };
        this.cells.forEach((c) => (c.visible = false));
    }

    show_about(): void {
        this.about.visible = true;
        this.about_text.position.copy(ABOUT_TEXT_INITIAL_POS);
    }
}
