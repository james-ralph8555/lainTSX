import { SceneKind, SceneUpdateContext, SceneUpdateResult } from "./engine";
import { Group, Sprite3D } from "./objects";
import { CursorLocation, SiteKind, SiteScene } from "./site";
import { Texture } from "./textures";
import { secs_to_ms, vec3 } from "./util";
import * as THREE from "three";

export function update_change_site_scene(
    change_site: ChangeSiteScene,
    ctx: SceneUpdateContext
): SceneUpdateResult {
    const { time_ctx, game_state, camera } = ctx;
    const { progress } = game_state;
    const { time } = time_ctx;

    if (time >= change_site.change_time) {
        return {
            new_scene: new SiteScene(
                progress,
                change_site.target_location,
                time,
                camera,
                { intro: true }
            ),
        };
    }

    return {};
}

export class ChangeSiteScene extends THREE.Scene {
    scene_kind: SceneKind.ChangeSite;
    change_time: number;
    target_location: CursorLocation;

    constructor(enter_time: number, target_location: CursorLocation) {
        super();

        this.scene_kind = SceneKind.ChangeSite;

        this.target_location = target_location;
        this.change_time = enter_time + secs_to_ms(3.5);

        const group = new Group({
            position: vec3(0, 0, -1),
            children: [
                new Sprite3D(Texture.Disc_Lof, {
                    scale_factor: 4,
                    position: vec3(0.05, 0.35, 0),
                }),
                new Sprite3D(Texture.Disc_Change_Site, {
                    scale_factor: 4,
                    position: vec3(0, 0.2, 0),
                }),
                new Sprite3D(Texture.Disc_Line, {
                    scale_factor: 4,
                    position: vec3(0, 0.15, 0),
                }),
                new Sprite3D(Texture.Disc_Line, {
                    scale_factor: 4,
                    position: vec3(0, 0.13, 0),
                }),
                new Sprite3D(Texture.Disc_Checking_In_Progress, {
                    scale_factor: 4.5,
                    position: vec3(0, -0.1, 0),
                }),
                new Sprite3D(Texture.Disc_Slope_Line, {
                    scale_factor: 4.5,
                    position: vec3(0, -0.3, 0),
                }),
                new Sprite3D(Texture.Disc_Slope_Line, {
                    scale_factor: 4.5,
                    position: vec3(0, -0.32, 0),
                }),
                new Sprite3D(Texture.Disc, {
                    scale_factor: 4.5,
                    position: vec3(-0.05, -0.24, 0),
                    render_order: 9999,
                }),
            ],
        });

        const line_gap = 0.02;
        const starting_y = -0.285;

        for (let i = 0; i < 8; i++) {
            group.add(
                new Sprite3D(Texture.Disc_Line, {
                    scale_factor: 4.5,
                    position: vec3(0, starting_y + line_gap * i, 0),
                })
            );
        }

        group.add(
            new Sprite3D(this.target_location.site_kind === SiteKind.A ? Texture.Disc_1 : Texture.Disc_2, {
                scale_factor: 4.5,
                position: vec3(0.25, -0.24, 0),
            })
        );

        this.add(group);

        this.background = new THREE.Color(0xffffff);
    }
}
