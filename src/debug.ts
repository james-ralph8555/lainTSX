import { Engine, SceneKind, SceneUpdateContext, SceneUpdateResult } from "./engine";
import * as THREE from "three";

// useful for quickly sketching stuff if need be.

export class DebugScene extends THREE.Scene {
    scene_kind: SceneKind.Debug;

    constructor() {
        super();

        this.scene_kind = SceneKind.Debug;
    }
}

export function update_debug_scene(_debug: DebugScene, _ctx: SceneUpdateContext): SceneUpdateResult {
    return {};
}

export function handle_additional_debug_keys(_engine: Engine): void {}
