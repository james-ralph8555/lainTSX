import { Scene, SceneKind, SceneUpdateContext, SceneUpdateResult } from "./engine";
import * as THREE from "three";
import { random_between, secs_to_ms, vec3 } from "./util";
import { Group, Mesh, Sprite3D, Spritesheet3D } from "./objects";
import { Texture } from "./textures";

export type SceneFactory = (time: number) => Scene;

export function update_loading_scene(loading: LoadingScene, ctx: SceneUpdateContext): SceneUpdateResult {
    const { time_ctx } = ctx;

    loading.accela.update(time_ctx.time);

    if (time_ctx.time >= loading.new_scene_set_time) {
        return { new_scene: loading.new_scene_factory(time_ctx.time) };
    }

    return {};
}

export class LoadingScene extends THREE.Scene {
    scene_kind: SceneKind.Loading;
    new_scene_factory: SceneFactory;
    new_scene_set_time: number;

    accela: Spritesheet3D;

    constructor(enter_time: number, new_scene_factory: SceneFactory) {
        super();

        this.scene_kind = SceneKind.Loading;

        this.new_scene_set_time = enter_time + random_between(200, 800);

        this.new_scene_factory = new_scene_factory;

        this.accela = new Spritesheet3D(Texture.Loading_Accela, {
            scale_factor: 15,
            render_order: -1,
            frame_count: 29,
            rows: 3,
            columns: 10,
            frame_update_rate: secs_to_ms(1 / 60),
            position: vec3(0, 0.25, 0),
            loop: true,
        });

        this.add(
            new Group({
                children: [
                    this.accela,
                    new Sprite3D(Texture.Life_Instinct_Function_Os, {
                        scale_factor: 15,
                        position: vec3(0, -0.4, 0),
                    }),
                    new Mesh(
                        new THREE.PlaneGeometry(),
                        new THREE.MeshBasicMaterial({ color: 0x0, depthTest: false, transparent: true }),
                        {
                            scale: vec3(20, 20, 20),
                            render_order: -2,
                        }
                    ),
                ],
                position: vec3(0, 0, -3),
            })
        );
    }
}
