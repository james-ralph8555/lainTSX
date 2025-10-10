import { Key } from "./engine";

const BUTTON = {
    SOUTH: 0,   // Cross/A
    EAST: 1,    // Circle/B
    WEST: 2,    // Square/X
    NORTH: 3,   // Triangle/Y
    L1: 4,
    R1: 5,
    L2: 6,
    R2: 7,
    SELECT: 8,
    START: 9,
    L3: 10,
    R3: 11,
    DPAD_UP: 12,
    DPAD_DOWN: 13,
    DPAD_LEFT: 14,
    DPAD_RIGHT: 15,
};

export interface GamepadLayout {
    name: string;
    mappings: Record<number, Key>;
}

export const DEFAULT_GAMEPAD_LAYOUTS: GamepadLayout[] = [
    {
        name: "Official",
        mappings: {
            [BUTTON.DPAD_DOWN]: Key.Down,
            [BUTTON.DPAD_LEFT]: Key.Left,
            [BUTTON.DPAD_UP]: Key.Up,
            [BUTTON.DPAD_RIGHT]: Key.Right,
            [BUTTON.EAST]: Key.Circle,
            [BUTTON.SOUTH]: Key.Cross,
            [BUTTON.NORTH]: Key.Triangle,
            [BUTTON.WEST]: Key.Square,
            [BUTTON.R2]: Key.R2,
            [BUTTON.L2]: Key.L2,
            [BUTTON.L1]: Key.L1,
            [BUTTON.R1]: Key.R1,
            [BUTTON.START]: Key.Start,
            [BUTTON.SELECT]: Key.Select,
        }
    },
    {
        name: "Alternative",
        mappings: {
            [BUTTON.DPAD_DOWN]: Key.Down,
            [BUTTON.DPAD_LEFT]: Key.Left,
            [BUTTON.DPAD_UP]: Key.Up,
            [BUTTON.DPAD_RIGHT]: Key.Right,
            [BUTTON.SOUTH]: Key.Circle,
            [BUTTON.EAST]: Key.Cross,
            [BUTTON.WEST]: Key.Triangle,
            [BUTTON.NORTH]: Key.Square,
            [BUTTON.R2]: Key.R2,
            [BUTTON.L2]: Key.L2,
            [BUTTON.L1]: Key.L1,
            [BUTTON.R1]: Key.R1,
            [BUTTON.START]: Key.Start,
            [BUTTON.SELECT]: Key.Select,
        }
    },
    {
        name: "Classic",
        mappings: {
            [BUTTON.DPAD_DOWN]: Key.Down,
            [BUTTON.DPAD_LEFT]: Key.Left,
            [BUTTON.DPAD_UP]: Key.Up,
            [BUTTON.DPAD_RIGHT]: Key.Right,
            [BUTTON.WEST]: Key.Circle,
            [BUTTON.EAST]: Key.Cross,
            [BUTTON.NORTH]: Key.Triangle,
            [BUTTON.SOUTH]: Key.Square,
            [BUTTON.R2]: Key.R2,
            [BUTTON.L2]: Key.L2,
            [BUTTON.L1]: Key.L1,
            [BUTTON.R1]: Key.R1,
            [BUTTON.START]: Key.Start,
            [BUTTON.SELECT]: Key.Select,
        }
    }
];

const GAMEPAD_LAYOUT_KEY = "lainTSX-gamepad-layout";

const DEADZONE = 0.1;
const DEBOUNCE_TIME = 150; // milliseconds

export class GamepadManager {
    private previousButtonStates: boolean[][] = [];
    private buttonDebounceTimes: number[][] = [];
    private connectedGamepads: Set<number> = new Set();
    private digitalDPadStates: boolean[] = [];
    private currentLayout: GamepadLayout;
    // Throttled discovery polling to avoid constant per-frame scanning
    private lastDiscoveryPoll: number = 0;
    private readonly discoveryPollInterval: number = 1000; // ms

    constructor() {
        this.setupEventListeners();
        this.currentLayout = this.loadLayout();
        // Initialize digital D-pad states to match engine's key_states array
        this.digitalDPadStates = [];
        for (const _ in Key) {
            this.digitalDPadStates.push(false);
        }
    }

    private loadLayout(): GamepadLayout {
        const storedLayout = localStorage.getItem(GAMEPAD_LAYOUT_KEY);
        if (storedLayout) {
            try {
                const parsed = JSON.parse(storedLayout);
                // Normalize mapping values: allow string action names from UI, convert to Key enum
                const mappings: Record<number, Key> = {};
                if (parsed && parsed.mappings) {
                    for (const [btn, val] of Object.entries(parsed.mappings as Record<string, string | number>)) {
                        const idx = Number(btn);
                        if (typeof val === "string" && val in Key) {
                            mappings[idx] = (Key as any)[val as keyof typeof Key] as Key;
                        } else {
                            mappings[idx] = val as Key;
                        }
                    }
                }
                return { name: parsed.name, mappings } as GamepadLayout;
            } catch (e) {
                console.error("Failed to parse gamepad layout:", e);
            }
        }
        return DEFAULT_GAMEPAD_LAYOUTS[0];
    }

    public saveLayout(layout: GamepadLayout): void {
        // Normalize incoming layout (may come from UI with string action names)
        const mappings: Record<number, Key> = {};
        for (const [btn, val] of Object.entries(layout.mappings as Record<string, string | number>)) {
            const idx = Number(btn);
            if (typeof val === "string" && val in Key) {
                mappings[idx] = (Key as any)[val as keyof typeof Key] as Key;
            } else {
                mappings[idx] = val as Key;
            }
        }
        this.currentLayout = { name: layout.name, mappings };
        localStorage.setItem(GAMEPAD_LAYOUT_KEY, JSON.stringify(this.currentLayout));
    }

    public getCurrentLayout(): GamepadLayout {
        return this.currentLayout;
    }

    public getAvailableLayouts(): GamepadLayout[] {
        return DEFAULT_GAMEPAD_LAYOUTS;
    }

    private setupEventListeners(): void {
        window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
            console.log(`Gamepad connected: ${e.gamepad.id}`);
            this.connectedGamepads.add(e.gamepad.index);
        });

        window.addEventListener("gamepaddisconnected", (e: GamepadEvent) => {
            console.log(`Gamepad disconnected: ${e.gamepad.id}`);
            this.connectedGamepads.delete(e.gamepad.index);
        });
    }

    private translateButton(buttonIndex: number): Key | null {
        return this.currentLayout.mappings[buttonIndex] || null;
    }



    private handleAnalogTriggers(gamepad: Gamepad, keyStates: boolean[], gamepadIndex: number, currentTime: number): void {
        // Handle L2 and R2 analog triggers
        const l2Button = gamepad.buttons[BUTTON.L2];
        const r2Button = gamepad.buttons[BUTTON.R2];

        if (l2Button) {
            const isPressed = l2Button.value > 0.5;
            const wasPressed = this.previousButtonStates[gamepadIndex][BUTTON.L2];
            
            if (isPressed && !wasPressed) {
                const timeSinceLastPress = currentTime - this.buttonDebounceTimes[gamepadIndex][BUTTON.L2];
                if (timeSinceLastPress >= DEBOUNCE_TIME) {
                    keyStates[Key.L2] = true;
                    this.buttonDebounceTimes[gamepadIndex][BUTTON.L2] = currentTime;
                } else {
                    keyStates[Key.L2] = false;
                }
            } else {
                keyStates[Key.L2] = false;
            }
        }

        if (r2Button) {
            const isPressed = r2Button.value > 0.5;
            const wasPressed = this.previousButtonStates[gamepadIndex][BUTTON.R2];
            
            if (isPressed && !wasPressed) {
                const timeSinceLastPress = currentTime - this.buttonDebounceTimes[gamepadIndex][BUTTON.R2];
                if (timeSinceLastPress >= DEBOUNCE_TIME) {
                    keyStates[Key.R2] = true;
                    this.buttonDebounceTimes[gamepadIndex][BUTTON.R2] = currentTime;
                } else {
                    keyStates[Key.R2] = false;
                }
            } else {
                keyStates[Key.R2] = false;
            }
        }
    }

    private handleAnalogSticks(gamepad: Gamepad, keyStates: boolean[], gamepadIndex: number, currentTime: number): void {
        const leftX = gamepad.axes[0];
        const leftY = gamepad.axes[1];

        // D-pad emulation from left stick
        const isUp = leftY < -DEADZONE;
        const isDown = leftY > DEADZONE;
        const isLeft = leftX < -DEADZONE;
        const isRight = leftX > DEADZONE;

        // Use separate indices for D-pad states (16-19)
        const DPAD_UP_STATE = 16;
        const DPAD_DOWN_STATE = 17;
        const DPAD_LEFT_STATE = 18;
        const DPAD_RIGHT_STATE = 19;

        // Get previous states
        const prevUp = this.previousButtonStates[gamepadIndex][DPAD_UP_STATE];
        const prevDown = this.previousButtonStates[gamepadIndex][DPAD_DOWN_STATE];
        const prevLeft = this.previousButtonStates[gamepadIndex][DPAD_LEFT_STATE];
        const prevRight = this.previousButtonStates[gamepadIndex][DPAD_RIGHT_STATE];

        if (isUp && !prevUp) {
            const timeSinceLastPress = currentTime - this.buttonDebounceTimes[gamepadIndex][DPAD_UP_STATE];
            keyStates[Key.Up] = timeSinceLastPress >= DEBOUNCE_TIME;
            if (timeSinceLastPress >= DEBOUNCE_TIME) {
                this.buttonDebounceTimes[gamepadIndex][DPAD_UP_STATE] = currentTime;
            }
        } else {
            keyStates[Key.Up] = false;
        }

        if (isDown && !prevDown) {
            const timeSinceLastPress = currentTime - this.buttonDebounceTimes[gamepadIndex][DPAD_DOWN_STATE];
            keyStates[Key.Down] = timeSinceLastPress >= DEBOUNCE_TIME;
            if (timeSinceLastPress >= DEBOUNCE_TIME) {
                this.buttonDebounceTimes[gamepadIndex][DPAD_DOWN_STATE] = currentTime;
            }
        } else {
            keyStates[Key.Down] = false;
        }

        if (isLeft && !prevLeft) {
            const timeSinceLastPress = currentTime - this.buttonDebounceTimes[gamepadIndex][DPAD_LEFT_STATE];
            keyStates[Key.Left] = timeSinceLastPress >= DEBOUNCE_TIME;
            if (timeSinceLastPress >= DEBOUNCE_TIME) {
                this.buttonDebounceTimes[gamepadIndex][DPAD_LEFT_STATE] = currentTime;
            }
        } else {
            keyStates[Key.Left] = false;
        }

        if (isRight && !prevRight) {
            const timeSinceLastPress = currentTime - this.buttonDebounceTimes[gamepadIndex][DPAD_RIGHT_STATE];
            keyStates[Key.Right] = timeSinceLastPress >= DEBOUNCE_TIME;
            if (timeSinceLastPress >= DEBOUNCE_TIME) {
                this.buttonDebounceTimes[gamepadIndex][DPAD_RIGHT_STATE] = currentTime;
            }
        } else {
            keyStates[Key.Right] = false;
        }

        // Update previous states for next frame
        this.previousButtonStates[gamepadIndex][DPAD_UP_STATE] = isUp;
        this.previousButtonStates[gamepadIndex][DPAD_DOWN_STATE] = isDown;
        this.previousButtonStates[gamepadIndex][DPAD_LEFT_STATE] = isLeft;
        this.previousButtonStates[gamepadIndex][DPAD_RIGHT_STATE] = isRight;
    }

    public update(keyStates: boolean[]): void {
        const currentTime = performance.now();

        // If we haven't seen any gamepads, throttle discovery polling
        if (this.connectedGamepads.size === 0) {
            if (currentTime - this.lastDiscoveryPoll < this.discoveryPollInterval) {
                return;
            }
            this.lastDiscoveryPoll = currentTime;

            const probe = navigator.getGamepads();
            for (let i = 0; i < probe.length; i++) {
                const gp = probe[i];
                if (gp && gp.connected) {
                    this.connectedGamepads.add(gp.index);
                }
            }

            if (this.connectedGamepads.size === 0) {
                return; // still nothing connected; skip heavy work this frame
            }
        }

        const gamepads = navigator.getGamepads();

        // Reset digital D-pad states at start of update
        this.digitalDPadStates.fill(false);

        // Only iterate over indices we believe are connected
        for (const i of Array.from(this.connectedGamepads)) {
            const gamepad = gamepads[i];
            if (!gamepad || !gamepad.connected) {
                // Keep the Set in sync if a gamepad disappeared without event
                this.connectedGamepads.delete(i);
                continue;
            }

            // Ensure per-gamepad arrays are initialized
            if (!this.previousButtonStates[i]) this.previousButtonStates[i] = [];
            if (!this.buttonDebounceTimes[i]) this.buttonDebounceTimes[i] = [];

            while (this.previousButtonStates[i].length < gamepad.buttons.length) {
                this.previousButtonStates[i].push(false);
                this.buttonDebounceTimes[i].push(0);
            }

            // Ensure we have space for D-pad states (indices 16-19)
            while (this.previousButtonStates[i].length < 20) {
                this.previousButtonStates[i].push(false);
                this.buttonDebounceTimes[i].push(0);
            }

            // Handle digital buttons
            for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
                const button = gamepad.buttons[buttonIndex];
                const key = this.translateButton(buttonIndex);

                if (key !== null) {
                    const isPressed = button.pressed;
                    const wasPressed = this.previousButtonStates[i][buttonIndex];

                    // Check if this is a d-pad button
                    const isDPadButton =
                        buttonIndex === BUTTON.DPAD_UP ||
                        buttonIndex === BUTTON.DPAD_DOWN ||
                        buttonIndex === BUTTON.DPAD_LEFT ||
                        buttonIndex === BUTTON.DPAD_RIGHT;

                    if (isDPadButton) {
                        // Apply debouncing to d-pad buttons
                        if (isPressed && !wasPressed) {
                            const timeSinceLastPress = currentTime - this.buttonDebounceTimes[i][buttonIndex];

                            if (timeSinceLastPress >= DEBOUNCE_TIME) {
                                this.digitalDPadStates[key] = true;
                                this.buttonDebounceTimes[i][buttonIndex] = currentTime;
                            } else {
                                this.digitalDPadStates[key] = false;
                            }
                        } else {
                            this.digitalDPadStates[key] = false;
                        }
                    } else {
                        // Debouncing for other buttons
                        if (isPressed && !wasPressed) {
                            const timeSinceLastPress = currentTime - this.buttonDebounceTimes[i][buttonIndex];

                            if (timeSinceLastPress >= DEBOUNCE_TIME) {
                                keyStates[key] = true;
                                this.buttonDebounceTimes[i][buttonIndex] = currentTime;
                            } else {
                                keyStates[key] = false;
                            }
                        } else {
                            keyStates[key] = false;
                        }
                    }

                    // Store current state for next frame
                    this.previousButtonStates[i][buttonIndex] = isPressed;
                }
            }

            // Handle analog triggers
            this.handleAnalogTriggers(gamepad, keyStates, i, currentTime);

            // Handle analog sticks (for D-pad emulation)
            this.handleAnalogSticks(gamepad, keyStates, i, currentTime);
        }

        // Apply digital D-pad states after processing all gamepads
        keyStates[Key.Up] = this.digitalDPadStates[Key.Up] || keyStates[Key.Up];
        keyStates[Key.Down] = this.digitalDPadStates[Key.Down] || keyStates[Key.Down];
        keyStates[Key.Left] = this.digitalDPadStates[Key.Left] || keyStates[Key.Left];
        keyStates[Key.Right] = this.digitalDPadStates[Key.Right] || keyStates[Key.Right];
    }

    public isAnyGamepadConnected(): boolean {
        return this.connectedGamepads.size > 0;
    }

    public getConnectedGamepadCount(): number {
        return this.connectedGamepads.size;
    }

    public getCurrentGamepadInfo(): { id: string } | null {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad && gamepad.connected) {
                return { id: gamepad.id };
            }
        }
        return null;
    }

    public getCurrentButtonStates(): boolean[] {
        const gamepads = navigator.getGamepads();
        const buttonStates: boolean[] = [];
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad || !gamepad.connected) continue;
            
            // Return button states for the first connected gamepad
            for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
                buttonStates[buttonIndex] = gamepad.buttons[buttonIndex].pressed;
            }
            
            // Also include analog stick states as virtual buttons (16-19)
            const leftX = gamepad.axes[0];
            const leftY = gamepad.axes[1];
            buttonStates[16] = leftY < -DEADZONE;  // Up
            buttonStates[17] = leftY > DEADZONE;   // Down
            buttonStates[18] = leftX < -DEADZONE;  // Left
            buttonStates[19] = leftX > DEADZONE;   // Right
            
            break; // Only return states for the first connected gamepad
        }
        
        return buttonStates;
    }
}

export const gamepadManager = new GamepadManager();
