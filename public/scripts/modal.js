const LANG_KEY = "lainTSX-lang";
const KEYBINDINGS_KEY = "lainTSX-keys"
const GAMEPAD_LAYOUT_KEY = "lainTSX-gamepad-layout"
const SAVE_KEY = "lainTSX-save-v3"

const SVG_ICONS = {
        circle: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2"/></svg>',
        triangle: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2 L14 12 L2 12 Z" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
        cross: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2"/></svg>',
        square: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" stroke="currentColor" stroke-width="2"/></svg>'
}

const LAND_AND_BINDINGS_HTML = `
        <div class="modal-inner-row" id="lang-bindings-modal">
                <div class="modal-entry">
                        <div class="modal-entry-title language">Language</div>
                        <div class="language-entry" data-lang="en" id="lang-en">English</div>
                        <div class="language-entry" data-lang="de" id="lang-de">German</div>
                        <div class="language-entry" data-lang="fr" id="lang-fr">French</div>
                        <div class="language-entry" data-lang="ja" id="lang-ja">Japanese</div>
                        <div class="language-entry" data-lang="ko" id="lang-ko">Korean</div>
                        <div class="language-entry" data-lang="pt-BR" id="lang-pt-BR">Portuguese</div>
                        <div class="language-entry" data-lang="ru" id="lang-ru">Russian</div>
                        </div>
                        <div class="modal-entry">
                        <button class="reset-keybindings-button" id="reset-keybinds-btn">
                                Reset keybindings
                        </button>
                        <div class="keybindings" id="keybinds-list"></div>
                </div>
        </div>
`

const GAMEPAD_HTML = `
        <div class="modal-inner-row" id="gamepad-modal" style="display: none;">
                <div class="modal-entry">
                        <div class="modal-entry-title">Gamepad Controls</div>
                        <div class="gamepad-layout-selector">
                                <label>Layout</label>
                                <div class="gamepad-layout-buttons">
                                        <div class="gamepad-layout-entry active" data-layout="Official" id="layout-official">Official</div>
                                        <div class="gamepad-layout-entry" data-layout="Alternative" id="layout-alternative">Alternative</div>
                                        <div class="gamepad-layout-entry" data-layout="Classic" id="layout-classic">Classic</div>
                                </div>
                        </div>
                        <div class="gamepad-visual-container">
                                <div class="gamepad-left-column">
                                        <div class="gamepad-controller">
                                                <div class="gamepad-dpad">
                                                        <div class="gamepad-button gamepad-dpad-up" data-button="12">↑</div>
                                                        <div class="gamepad-button gamepad-dpad-down" data-button="13">↓</div>
                                                        <div class="gamepad-button gamepad-dpad-left" data-button="14">←</div>
                                                        <div class="gamepad-button gamepad-dpad-right" data-button="15">→</div>
                                                </div>
                                                <div class="gamepad-action-buttons">
                                                        <div class="gamepad-button gamepad-button-north" data-button="3">${SVG_ICONS.triangle}</div>
                                                        <div class="gamepad-button gamepad-button-west" data-button="2">${SVG_ICONS.square}</div>
                                                        <div class="gamepad-button gamepad-button-east" data-button="1">${SVG_ICONS.circle}</div>
                                                        <div class="gamepad-button gamepad-button-south" data-button="0">${SVG_ICONS.cross}</div>
                                                </div>
                                                <div class="gamepad-stick left"><div class="thumb"></div></div>
                                                <div class="gamepad-stick right"><div class="thumb"></div></div>
                                                <div class="gamepad-shoulder-buttons">
                                                        <div class="gamepad-button gamepad-button-l2" data-button="6">L2</div>
                                                        <div class="gamepad-button gamepad-button-r2" data-button="7">R2</div>
                                                        <div class="gamepad-button gamepad-button-l1" data-button="4">L1</div>
                                                        <div class="gamepad-button gamepad-button-r1" data-button="5">R1</div>
                                                </div>
                                                <div class="gamepad-center-buttons">
                                                        <div class="gamepad-button gamepad-button-select" data-button="8">SELECT</div>
                                                        <div class="gamepad-button gamepad-button-start" data-button="9">START</div>
                                                </div>
                                        </div>
                                        <div class="gamepad-status" id="gamepad-status">
                                                <div class="gamepad-status-title">Controller Status</div>
                                                <div class="gamepad-status-info" id="gamepad-status-info">Controller not initialized</div>
                                        </div>
                                </div>
                                <div class="gamepad-mappings">
                                        <div class="gamepad-mapping-title">Button Mappings</div>
                                        <div class="gamepad-mapping-list" id="gamepad-mapping-list"></div>
                                </div>
                        </div>
                </div>
        </div>
`

const SAVE_FILE_HTML = `
        <div class="modal-entry" id="save-file-modal">
                <div>You can download your current save as a JSON file and re-import it later.</div>
                <button class="save-file-button" id="export-btn">
                <span class="lime">Export </span> save file
                </button>
                <div class="modal-error-msg" id="export-error"></div>
                <hr />
                <div>
                You can import an exported save file from here (will refresh the page once once
                uploaded).
                </div>
                <div class="red">
                WARNING: Doing so will override your current save. Export it prior to doing this.
                </div>
                <input type="file" id="save-import" />
                <div class="modal-error-msg" id="import-error"></div>
                <hr />
                <div>Reset your current progress (will refresh the page).</div>
                <div class="red">WARNING: Resets your current progress.</div>
                <button class="save-file-button" id="reset-btn" data-triggered>
                <span class="red">Reset</span> save file
                </button>
                <hr />
                <div>In case you are somehow stuck in the game, pressing this button will set Lain to the starting position (will refresh the page.)</div>
                <button class="save-file-button" id="unstuck-btn">
                <span class="orange">Unstuck</span> save file
                </button>
                <div class="modal-error-msg" id="unstuck-error"></div>
                <hr />
                <div>Clear local storage which contains keybind configuration, gamepad layout, and language settings (will refresh the page).</div>
                <div class="red">WARNING: This will reset all your settings to defaults.</div>
                <button class="save-file-button" id="clear-storage-btn" data-triggered>
                <span class="red">Clear</span> local storage
                </button>
                <div class="modal-error-msg" id="clear-storage-error"></div>
        </div>
`

const SAVE_EDITOR_HTML = `
        <div class="modal-entry editor" id="save-editor-modal">
                <div>You can modify your existing save file here.<br/><br/> This is mostly a feature meant for playtesting but I'm leaving it here in case you find it useful. 
                Some of these states are supposed to be intertwined - i.e. viewing a GaTE node always leads to a GaTE level increase. Manually changing these things (e.g. setting all nodes as viewed but keeping GaTE level to 0, etc.) may lead to unexpected bugs. 
                <span class="red">
                Use at your own risk!
                </span>
                <br/>
                <span class="red">It is strongly advised that you back up <span class="lime">(Export)</span> your save file before making any changes from here.</span></div>
                <div>Make the changes necessary, and then click "Apply Changes" to actually modify your save file.</div>
                <button class="editor-button" id="apply-editor-changes" data-triggered>Apply Changes</button>
                <div class="editor-table">
                <div class="editor-col left">
                        <div class="editor-key">SSkn Level</div>
                        <div class="editor-buttons">
                                <button class="editor-button" id="sskn-dec">-</button>
                                <div id="sskn-lvl">0</div>
                                <button class="editor-button" id="sskn-inc">+</button>
                        </div>
                        <hr class="editor-hr" />
                        <div class="editor-key">GaTE Level</div>
                        <div class="editor-buttons">
                                <button class="editor-button" id="gate-dec">-</button>
                                <div id="gate-lvl">0</div>
                                <button class="editor-button" id="gate-inc">+</button>
                        </div>
                        <hr class="editor-hr" />
                        <div class="editor-key">Final Video Viewcount</div>
                        <div class="editor-buttons">
                                <button class="editor-button" id="vc-dec">-</button>
                                <div id="vc">0</div>
                                <button class="editor-button" id="vc-inc">+</button>
                        </div>
                </div>
                <div class="editor-col">
                        <div class="editor-key">Polytan</div>
                        <div class="editor-buttons">
                                <div class="editor-polytan">
                                        <div class="editor-polytan-row">
                                                <button class="editor-button" id="poly-body-toggle"></button>
                                        </div>
                                        <div class="editor-polytan-row">
                                                <button class="editor-button" id="poly-head-toggle"></button>
                                        </div>
                                        <div class="editor-polytan-row">
                                                <button class="editor-button" id="poly-left-arm-toggle"></button>
                                        </div>
                                        <div class="editor-polytan-row">
                                                <button class="editor-button" id="poly-right-arm-toggle"></button>
                                        </div>
                                        <div class="editor-polytan-row">
                                                <button class="editor-button" id="poly-left-leg-toggle"></button>
                                        </div>
                                        <div class="editor-polytan-row">
                                                <button class="editor-button" id="poly-right-leg-toggle"></button>
                                        </div>
                                </div>
                        </div>
                        <hr class="editor-hr" />
                        <div class="editor-key">Nodes</div>
                        <div class="editor-buttons">
                                <button class="editor-button" id="view-all-nodes"><span class="lime">Mark</span> all as viewed</button>
                                <button class="editor-button" id="unview-all-nodes"><span class="red">Unmark</span> all as viewed</button>
                        </div>
                </div>
                </div>
        </div>
`

const MODAL_HTML = `
        <div id="global-modal" class="modal">
            <div class="modal-inner">
                <div class="modal-tabs">
                        <div class="modal-tab active" id="lang-bindings-tab">Language & Keybindings</div>
                        <div class="modal-tab" id="gamepad-tab">Gamepad</div>
                        <div class="modal-tab" id="save-file-tab">Save file utilities</div>
                        <div class="modal-tab" id="save-editor-tab">Save editor</div>
                </div>
                ${LAND_AND_BINDINGS_HTML}
                ${GAMEPAD_HTML}
                ${SAVE_FILE_HTML}
                ${SAVE_EDITOR_HTML}
            </div>
        </div>
`;

const Key = {
        Left: 0,
        Right: 1,
        Up: 2,
        Down: 3,
        L1: 4,
        L2: 5,
        R1: 6,
        R2: 7,
        Circle: 8,
        Triangle: 9,
        Cross: 10,
        Square: 11,
        Select: 12,
        Start: 13,
}

const KEY_DATA = [
        { icon: "←", description: "Go left" },
        { icon: "→", description: "Go right" },
        { icon: "↑", description: "Go up" },
        { icon: "↓", description: "Go down" },
        { icon: "L1", description: "Rotate left" },
        { icon: "L2", description: "Open level selector" },
        { icon: "R1", description: "Rotate right" },
        { icon: "R2", description: "Look up/down" },
        { icon: SVG_ICONS.circle, description: "Confirm" },
        { icon: SVG_ICONS.triangle, description: "Menu" },
        { icon: SVG_ICONS.cross, description: "Back" },
        { icon: SVG_ICONS.square, description: "Display node information" },
        { icon: "SELECT", description: "Menu" },
        { icon: "START", description: "Start/Proceed" },
]

const DEFAULT_KEYBINDINGS = [
        "arrowleft", "arrowright", "arrowup", "arrowdown", "w", "e", "r", "q", "x", "d", "z", "s", "c", "v"
]

const DEFAULT_GAMEPAD_LAYOUTS = [
        {
                name: "Official",
                mappings: {
                        12: "Up",     // DPAD_UP
                        13: "Down",   // DPAD_DOWN
                        14: "Left",   // DPAD_LEFT
                        15: "Right",  // DPAD_RIGHT
                        1: "Circle",  // EAST
                        0: "Cross",   // SOUTH
                        3: "Triangle", // NORTH
                        2: "Square",  // WEST
                        7: "R2",      // R2
                        6: "L2",      // L2
                        4: "L1",      // L1
                        5: "R1",      // R1
                        9: "Start",   // START
                        8: "Select",  // SELECT
                }
        },
        {
                name: "Alternative",
                mappings: {
                        12: "Up",     // DPAD_UP
                        13: "Down",   // DPAD_DOWN
                        14: "Left",   // DPAD_LEFT
                        15: "Right",  // DPAD_RIGHT
                        0: "Circle",  // SOUTH
                        1: "Cross",   // EAST
                        2: "Triangle", // WEST
                        3: "Square",  // NORTH
                        7: "R2",      // R2
                        6: "L2",      // L2
                        4: "L1",      // L1
                        5: "R1",      // R1
                        9: "Start",   // START
                        8: "Select",  // SELECT
                }
        },
        {
                name: "Classic",
                mappings: {
                        12: "Up",     // DPAD_UP
                        13: "Down",   // DPAD_DOWN
                        14: "Left",   // DPAD_LEFT
                        15: "Right",  // DPAD_RIGHT
                        2: "Circle",  // WEST
                        1: "Cross",   // EAST
                        3: "Triangle", // NORTH
                        0: "Square",  // SOUTH
                        7: "R2",      // R2
                        6: "L2",      // L2
                        4: "L1",      // L1
                        5: "R1",      // R1
                        9: "Start",   // START
                        8: "Select",  // SELECT
                }
        }
]

class Modal {
	constructor() {
		this.modal = null;
		this.is_open = false;
		this.gamepadLayout = null;
		this.selectedGamepadButton = null;
		this.gamepadUpdateInterval = null;
		
		this.load_gamepad_layout()
		this.create_modal();
		this.bind_events();

                const save_file = this.get_parsed_save_file()
                if (!save_file) {
                        this.editor_progress = {
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
                                viewed_nodes: [],
                        }
                } else {
                        this.editor_progress = save_file.progress
                }

                this.update_save_editor()
        }

        update_polytan_part(is_unlocked, id, name) {
                const el = document.getElementById(id)

                if (is_unlocked) {
                        el.innerHTML = `<span class="red">Lock</span> ${name}</span>`
                } else {
                        el.innerHTML = `<span class="lime">Unlock</span> ${name}</span>`
                }
        }

        update_save_editor() {
                const sskn_display = document.getElementById("sskn-lvl")
                const gate_display = document.getElementById("gate-lvl")
                const vc_display = document.getElementById("vc")

                sskn_display.innerHTML = this.editor_progress.sskn_level
                gate_display.innerHTML = this.editor_progress.gate_level
                vc_display.innerHTML = this.editor_progress.final_video_view_count

                const { body, head, left_arm, right_arm, left_leg, right_leg } = this.editor_progress.polytan_parts

                this.update_polytan_part(body, "poly-body-toggle", "Body")
                this.update_polytan_part(head, "poly-head-toggle", "Head")
                this.update_polytan_part(left_arm, "poly-left-arm-toggle", "Left Arm")
                this.update_polytan_part(right_arm, "poly-right-arm-toggle", "Right Arm")
                this.update_polytan_part(left_leg, "poly-left-leg-toggle", "Left Leg")
                this.update_polytan_part(right_leg, "poly-right-leg-toggle", "Right Leg")
        }

        create_modal() {
                document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
                this.modal = document.getElementById("global-modal");

                this.keybinds_list = document.getElementById("keybinds-list")
                this.gamepad_mapping_list = document.getElementById("gamepad-mapping-list")
                this.gamepad_layout_select = document.getElementById("gamepad-layout-select")
                
                this.refresh_keybindings()
                this.refresh_languages()
                this.refresh_gamepad_layout()
        }

        refresh_keybindings() {
                this.keybinds_list.innerHTML = ''

                const stored_keybindings = localStorage.getItem(KEYBINDINGS_KEY);
                if (stored_keybindings) {
                        try {
                                this.keybindings = JSON.parse(stored_keybindings)
                        } catch (err) { }
                }

                if (!this.keybindings) {
                        this.keybindings = DEFAULT_KEYBINDINGS
                }

                localStorage.setItem(KEYBINDINGS_KEY, JSON.stringify(this.keybindings))

                this.keybindings.forEach((k, v) => {
                        const data = KEY_DATA[v]

                        const html = `
                        <div class="keybind">
                            <div class="keybind-button" data-key="${v}">${k}</div>
                            <div>${data.icon}</div>
                            <div>${data.description}</div>
                        </div>`

                        this.keybinds_list.insertAdjacentHTML("beforeend", html)
                })

                this.keybinds_list.insertAdjacentHTML("beforeend",
                        `
                        <div class="keybind">
                            <div>k</div>
                            <div></div>
                            <div>Upscale game window</div>
                        </div>
                        <div class="keybind">
                            <div>j</div>
                            <div></div>
                            <div>Downscale game window</div>
                        </div>
                        <div class="keybind">
                            <div>t</div>
                            <div></div>
                            <div>Show emote wheel</div>
                        </div>
                        `
                )
        }

        load_gamepad_layout() {
                const stored_layout = localStorage.getItem(GAMEPAD_LAYOUT_KEY);
                if (stored_layout) {
                        try {
                                const parsed = JSON.parse(stored_layout);
                                // Normalize mapping values for display: convert numeric Key codes to string names
                                const normalizedMappings = {};
                                if (parsed && parsed.mappings) {
                                        for (const [btn, val] of Object.entries(parsed.mappings)) {
                                                if (typeof val === "number") {
                                                        const keyName = Object.keys(Key).find(k => Key[k] === val) || String(val);
                                                        normalizedMappings[btn] = keyName;
                                                } else {
                                                        normalizedMappings[btn] = val;
                                                }
                                        }
                                }
                                this.gamepadLayout = {
                                        name: parsed && parsed.name ? parsed.name : DEFAULT_GAMEPAD_LAYOUTS[0].name,
                                        mappings: Object.keys(normalizedMappings).length ? normalizedMappings : (parsed && parsed.mappings ? parsed.mappings : DEFAULT_GAMEPAD_LAYOUTS[0].mappings)
                                };
                        } catch (err) {
                                this.gamepadLayout = DEFAULT_GAMEPAD_LAYOUTS[0]
                        }
                } else {
                        this.gamepadLayout = DEFAULT_GAMEPAD_LAYOUTS[0]
                }
        }

        save_gamepad_layout(layout) {
                this.gamepadLayout = layout
                localStorage.setItem(GAMEPAD_LAYOUT_KEY, JSON.stringify(layout))
                window.dispatchEvent(new CustomEvent('updategamepadlayout', { detail: layout }));
        }

        refresh_gamepad_layout() {
        if (!this.gamepadLayout) return

        const mappingList = document.getElementById("gamepad-mapping-list")

        // Update layout buttons
        document.querySelectorAll(".gamepad-layout-entry").forEach(entry => {
            entry.classList.remove("active");
        });

        const activeLayout = document.getElementById(`layout-${this.gamepadLayout.name.toLowerCase()}`);
        if (activeLayout) {
            activeLayout.classList.add("active");
        }

        // Clear current mappings
        mappingList.innerHTML = ""

        // Create action to description mapping
        const actionDescriptions = {
            "Up": "Go up",
            "Down": "Go down", 
            "Left": "Go left",
            "Right": "Go right",
            "Cross": "Back",
            "Circle": "Confirm",
            "Triangle": "Menu",
            "Square": "Display node information",
            "L1": "Rotate left",
            "L2": "Open level selector",
            "R1": "Rotate right",
            "R2": "Look up/down",
            "Start": "Start/Proceed",
            "Select": "Menu"
        }

        // Add mappings with highlighting
        Object.entries(this.gamepadLayout.mappings).forEach(([button, action]) => {
            const mappingDiv = document.createElement("div")
            mappingDiv.className = "gamepad-mapping"
            // Ensure action is a readable string (convert numeric Key code if needed)
            const actionName = (typeof action === "number") ? (Object.keys(Key).find(k => Key[k] === action) || String(action)) : action
            mappingDiv.dataset.action = actionName
            mappingDiv.dataset.button = button

            const buttonSpan = document.createElement("span")
            buttonSpan.className = "gamepad-mapping-button"
            buttonSpan.innerHTML = this.get_button_symbol(button)

            const actionSpan = document.createElement("span")
            actionSpan.className = "gamepad-mapping-action"
            actionSpan.textContent = actionDescriptions[actionName] || actionName

            mappingDiv.appendChild(buttonSpan)
            mappingDiv.appendChild(actionSpan)
            mappingList.appendChild(mappingDiv)

            // Add hover effect to highlight corresponding button
            mappingDiv.addEventListener("mouseenter", () => {
                this.highlight_gamepad_button(button, true)
            })

            mappingDiv.addEventListener("mouseleave", () => {
                this.highlight_gamepad_button(button, false)
            })
        })
    }

    get_button_symbol(button) {
        const buttonSymbols = {
            0: SVG_ICONS.cross,
            1: SVG_ICONS.circle,
            2: SVG_ICONS.square,
            3: SVG_ICONS.triangle,
            4: "L1",
            5: "R1",
            6: "L2",
            7: "R2",
            8: "SELECT",
            9: "START",
            10: "L3",
            11: "R3",
            12: "↑",
            13: "↓",
            14: "←",
            15: "→",
        }
        return buttonSymbols[button] || `${button}`
    }

    bind_events() {
        document.addEventListener("click", (e) => {
            if (e.target.closest("#settings-button")) {
                this.open();
            }

            if (e.target === this.modal) {
                this.close();
            }

            if (e.target.closest(".language-entry")) {
                this.handle_lang_entry_click(e)
            }

            if (e.target.closest(".keybind-button")) {
                this.handle_bind_button_click(e)
            }

            if (e.target.closest("#export-btn")) {
                this.handle_export_btn_click()
            }

            if (e.target.closest("#reset-btn")) {
                this.handle_reset_btn_click(e)
            }

            if (e.target.closest("#reset-keybinds-btn")) {
                this.handle_reset_keybinds_click(e)
            }



            if (e.target.closest(".gamepad-layout-entry")) {
                this.handle_gamepad_layout_change(e)
            }

            if (e.target.closest(".gamepad-button")) {
                this.handle_gamepad_button_click(e)
            }

            if (e.target.closest("#unstuck-btn")) {
                this.unstuck()
            }

            if (e.target.closest("#clear-storage-btn")) {
                this.handle_clear_storage_btn_click(e)
            }

            if (e.target.closest("#sskn-dec")) {
                this.editor_progress.sskn_level = Math.max(this.editor_progress.sskn_level - 1, 0)
                this.update_save_editor()
            }

            if (e.target.closest("#sskn-inc")) {
                this.editor_progress.sskn_level = Math.min(this.editor_progress.sskn_level + 1, 6)
                this.update_save_editor()
            }

            if (e.target.closest("#gate-dec")) {
                this.editor_progress.gate_level = Math.max(this.editor_progress.gate_level - 1, 0)
                this.update_save_editor()
            }

            if (e.target.closest("#gate-inc")) {
                this.editor_progress.gate_level = Math.min(this.editor_progress.gate_level + 1, 4)
                this.update_save_editor()
            }

            if (e.target.closest("#vc-dec")) {
                this.editor_progress.final_video_view_count = Math.max(this.editor_progress.final_video_view_count - 1, 0)
                this.update_save_editor()
            }

            if (e.target.closest("#vc-inc")) {
                this.editor_progress.final_video_view_count = Math.min(this.editor_progress.final_video_view_count + 1, 5)
                this.update_save_editor()
            }

            if (e.target.closest("#poly-body-toggle")) {
                this.editor_progress.polytan_parts.body = !this.editor_progress.polytan_parts.body
                this.update_save_editor()
            }

            if (e.target.closest("#poly-head-toggle")) {
                this.editor_progress.polytan_parts.head = !this.editor_progress.polytan_parts.head
                this.update_save_editor()
            }

            if (e.target.closest("#poly-left-arm-toggle")) {
                this.editor_progress.polytan_parts.left_arm = !this.editor_progress.polytan_parts.left_arm
                this.update_save_editor()
            }

            if (e.target.closest("#poly-right-arm-toggle")) {
                this.editor_progress.polytan_parts.right_arm = !this.editor_progress.polytan_parts.right_arm
                this.update_save_editor()
            }

            if (e.target.closest("#poly-left-leg-toggle")) {
                this.editor_progress.polytan_parts.left_leg = !this.editor_progress.polytan_parts.left_leg
                this.update_save_editor()
            }

            if (e.target.closest("#poly-right-leg-toggle")) {
                this.editor_progress.polytan_parts.right_leg = !this.editor_progress.polytan_parts.right_leg
                this.update_save_editor()
            }

            if (e.target.closest("#view-all-nodes")) {
                this.get_all_node_ids().then(nodes => {
                    this.editor_progress.viewed_nodes = nodes
                })
            }

            if (e.target.closest("#unview-all-nodes")) {
                this.editor_progress.viewed_nodes = []
            }

            if (e.target.closest("#apply-editor-changes")) {
                this.apply_editor_changes(e)
            }

            const lang_bindings_modal = document.getElementById("lang-bindings-modal")
            const gamepad_modal = document.getElementById("gamepad-modal")
            const save_file_modal = document.getElementById("save-file-modal")
            const save_editor_modal = document.getElementById("save-editor-modal")

            const lang_bindings_tab = document.getElementById("lang-bindings-tab")
            const gamepad_tab = document.getElementById("gamepad-tab")
            const save_file_tab = document.getElementById("save-file-tab")
            const save_editor_tab = document.getElementById("save-editor-tab")

            if (e.target.closest("#lang-bindings-tab")) {
                lang_bindings_modal.style.display = 'flex'
                gamepad_modal.style.display = 'none'
                save_editor_modal.style.display = 'none'
                save_file_modal.style.display = 'none'

                document.querySelectorAll(".modal-tab").forEach(entry => {
                    entry.classList.remove("active");
                });

                lang_bindings_tab.classList.add('active')
            }

            if (e.target.closest("#gamepad-tab")) {
                lang_bindings_modal.style.display = 'none'
                gamepad_modal.style.display = 'flex'
                save_editor_modal.style.display = 'none'
                save_file_modal.style.display = 'none'

                document.querySelectorAll(".modal-tab").forEach(entry => {
                    entry.classList.remove("active");
                });

                gamepad_tab.classList.add('active')
            }

            if (e.target.closest("#save-file-tab")) {
                lang_bindings_modal.style.display = 'none'
                gamepad_modal.style.display = 'none'
                save_file_modal.style.display = 'flex'
                save_editor_modal.style.display = 'none'

                document.querySelectorAll(".modal-tab").forEach(entry => {
                    entry.classList.remove("active");
                });

                save_file_tab.classList.add('active')
            }

            if (e.target.closest("#save-editor-tab")) {
                lang_bindings_modal.style.display = 'none'
                gamepad_modal.style.display = 'none'
                save_file_modal.style.display = 'none'
                save_editor_modal.style.display = 'flex'

                document.querySelectorAll(".modal-tab").forEach(entry => {
                    entry.classList.remove("active");
                });

                save_editor_tab.classList.add('active')
            }
        });

        document.addEventListener("keydown", (e) => {
            if (this.is_open) {
                this.handle_keydown(e.key)
            }
        });

        document.getElementById("save-import").addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                this.import_save(file)
            }
        });
    }

    apply_editor_changes(e) {
        const btn = e.target.closest("#apply-editor-changes");

        const is_triggered = btn.dataset.triggered === "true"
        if (is_triggered) {
            const parsed = this.get_parsed_save_file()
            if (!parsed) {
                localStorage.setItem(SAVE_KEY, JSON.stringify(
                    {
                        site: "a",
                        a_location: {
                            site_kind: "a",
                            level: 4,
                            node_matrix_position: {
                                row: 1,
                                col: 0,
                            },
                            site_segment: 6,
                        },
                        b_location: {
                            site_kind: "b",
                            level: 1,
                            node_matrix_position: {
                                row: 2,
                                col: 0,
                            },
                            site_segment: 5,
                        },
                        name: "",
                        progress: this.editor_progress,
                    }
                ));
            } else {
                localStorage.setItem(SAVE_KEY, JSON.stringify(
                    {
                        ...parsed,
                        progress: this.editor_progress
                    }
                ));
            }

            location.reload();
        } else {
            btn.dataset.triggered = true
            btn.innerText = "Are you sure? (Click again if yes)"
        }
    }

    async get_all_node_ids() {
        try {
            const [a_req, b_req] = await Promise.all([
                fetch('/json/site_a.json'),
                fetch('/json/site_b.json')
            ]);

            const [a, b] = await Promise.all([
                a_req.json(),
                b_req.json()
            ]);

            const all_ids = []
            for (const layout of [a, b]) {
                for (const level of layout) {
                    for (const row of level) {
                        for (const node of row) {
                            if (node && node.id) {
                                all_ids.push(node.id)
                            }
                        }
                    }
                }
            }

            return all_ids;
        } catch (err) {
            console.error(err);
        }
    }

    get_save_file() {
        const save = localStorage.getItem(SAVE_KEY)
        if (save === null || save === "null" || save === undefined || save.trim() === "") {
            return null;
        }

        return save
    }

    get_parsed_save_file() {
        const save_file = this.get_save_file()
        if (!save_file) {
            return null;
        }

        try {
            return JSON.parse(save_file);
        } catch (err) {
            console.error(err)
        }

        return null
    }

    unstuck() {
        const save = this.get_save_file()
        if (save === null) {
            return;
        }

        const parsed = this.get_parsed_save_file()
        if (!parsed) {
            const elem = document.getElementById("unstuck-error")
            elem.style.display = "block"
            elem.innerText = "ERROR: failed to unstuck save file."
        } else {
            const json = {
                ...parsed,
                progress: parsed.progress,
                a_location: {
                site_kind: "a",
                level: 4,
                node_matrix_position: {
                    row: 1,
                    col: 0,
                },
                site_segment: 6,

            },
            b_location: {
                site_kind: "b",
                level: 1,
                node_matrix_position: {
                    row: 2,
                    col: 0,
                },
                site_segment: 5,
            }
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(json));

        location.reload()
        }
    }

    set_keybindings(keybindings) {
        this.keybindings = keybindings
        localStorage.setItem(KEYBINDINGS_KEY, keybindings)
        this.refresh_keybindings()

            window.dispatchEvent(new CustomEvent('updatekeybindings'));
    }

    handle_reset_keybinds_click() {
        this.set_keybindings(DEFAULT_KEYBINDINGS.slice())
    }



    handle_gamepad_layout_change(e) {
        const clicked_entry = e.target.closest(".gamepad-layout-entry");
        const layoutName = clicked_entry.dataset.layout;
        const layout = DEFAULT_GAMEPAD_LAYOUTS.find(l => l.name === layoutName)
        if (layout) {
            this.save_gamepad_layout(layout)
            this.refresh_gamepad_layout()
        }
    }

    handle_gamepad_button_click(e) {
        const button = e.target.closest(".gamepad-button")
        const buttonIndex = parseInt(button.dataset.button)
        
        // Remove previous selection
        document.querySelectorAll(".gamepad-button").forEach(btn => {
            btn.classList.remove("selected")
        })
        
        // Select current button
        button.classList.add("selected")
        this.selectedGamepadButton = buttonIndex
        
        // Highlight the corresponding mapping
        this.highlight_gamepad_mapping(buttonIndex)
    }

	highlight_gamepad_button(buttonIndex, highlight) {
		const button = document.querySelector(`.gamepad-button[data-button="${buttonIndex}"]`)
		if (button) {
			if (highlight) {
				button.classList.add("highlighted")
			} else {
				button.classList.remove("highlighted")
			}
		}
	}

	highlight_gamepad_mapping(buttonIndex) {
		const mappings = document.querySelectorAll(".gamepad-mapping")
		mappings.forEach((mapping, index) => {
			mapping.classList.remove("highlighted")
		})
		
		const buttonNames = Object.keys(this.gamepadLayout.mappings)
		const mappingIndex = buttonNames.indexOf(buttonIndex.toString())
		if (mappingIndex >= 0 && mappings[mappingIndex]) {
			mappings[mappingIndex].classList.add("highlighted")
		}
	}

	update_gamepad_button_states() {
		// Get button states directly from the gamepad API
		const gamepads = navigator.getGamepads();
		
		// Update controller status (only when text changes)
		const statusInfo = document.getElementById("gamepad-status-info");
		if (statusInfo) {
			let newText = "Controller not initialized";
			for (let i = 0; i < gamepads.length; i++) {
				const gamepad = gamepads[i];
				if (gamepad && gamepad.connected) {
					// Extract the controller name from the full gamepad.id string
					// Format: "Name (STANDARD GAMEPAD Vendor: xxxx Product: xxxx)"
					const match = gamepad.id.match(/^([^(]+)/);
					newText = match ? match[1].trim() : gamepad.id;
					break;
				}
			}
			if (statusInfo.textContent !== newText) {
				statusInfo.textContent = newText;
			}
		}
		
		// Clear all mapping highlights first
		document.querySelectorAll(".gamepad-mapping").forEach(mapping => {
			mapping.classList.remove("highlighted");
		});
		
		for (let i = 0; i < gamepads.length; i++) {
			const gamepad = gamepads[i];
			if (!gamepad || !gamepad.connected) continue;
			
			// Track which buttons are pressed to highlight their mappings
			const pressedButtons = [];
			
			// Update visual button states for this connected gamepad
			document.querySelectorAll(".gamepad-button").forEach(button => {
				const buttonIndex = parseInt(button.dataset.button);
				const isPressed = gamepad.buttons[buttonIndex] && gamepad.buttons[buttonIndex].pressed;
				
				// Don't override the manually selected button
				if (!button.classList.contains("selected") || !isPressed) {
					if (isPressed) {
						button.classList.add("selected");
						pressedButtons.push(buttonIndex);
					} else {
						button.classList.remove("selected");
					}
				} else if (isPressed) {
					pressedButtons.push(buttonIndex);
				}
			});
			
			// Also check analog stick states for D-pad and stick visuals
			const leftX = gamepad.axes[0];
			const leftY = gamepad.axes[1];
			const rightX = gamepad.axes[2];
			const rightY = gamepad.axes[3];
			const DEADZONE = 0.1;
			
			const stickUp = leftY < -DEADZONE;
			const stickDown = leftY > DEADZONE;
			const stickLeft = leftX < -DEADZONE;
			const stickRight = leftX > DEADZONE;
			
			// Update D-pad visual based on analog stick
			const dpadUp = document.querySelector(".gamepad-dpad-up");
			const dpadDown = document.querySelector(".gamepad-dpad-down");
			const dpadLeft = document.querySelector(".gamepad-dpad-left");
			const dpadRight = document.querySelector(".gamepad-dpad-right");

			// Update analog stick thumb positions
			const leftThumb = document.querySelector('.gamepad-stick.left .thumb');
			const rightThumb = document.querySelector('.gamepad-stick.right .thumb');
			const RADIUS = 28; // movement radius in px
			if (leftThumb) {
				const lx = Math.abs(leftX) > DEADZONE ? leftX : 0;
				const ly = Math.abs(leftY) > DEADZONE ? leftY : 0;
				leftThumb.style.transform = `translate(calc(-50% + ${lx * RADIUS}px), calc(-50% + ${ly * RADIUS}px))`;
			}
			if (rightThumb) {
				const rx = Math.abs(rightX) > DEADZONE ? rightX : 0;
				const ry = Math.abs(rightY) > DEADZONE ? rightY : 0;
				rightThumb.style.transform = `translate(calc(-50% + ${rx * RADIUS}px), calc(-50% + ${ry * RADIUS}px))`;
			}
			
			if (dpadUp) {
				const dPadPressed = gamepad.buttons[12] && gamepad.buttons[12].pressed;
				if (stickUp || dPadPressed) {
					dpadUp.classList.add("selected");
					pressedButtons.push(12); // DPAD_UP
				} else {
					dpadUp.classList.remove("selected");
				}
			}
			if (dpadDown) {
				const dPadPressed = gamepad.buttons[13] && gamepad.buttons[13].pressed;
				if (stickDown || dPadPressed) {
					dpadDown.classList.add("selected");
					pressedButtons.push(13); // DPAD_DOWN
				} else {
					dpadDown.classList.remove("selected");
				}
			}
			if (dpadLeft) {
				const dPadPressed = gamepad.buttons[14] && gamepad.buttons[14].pressed;
				if (stickLeft || dPadPressed) {
					dpadLeft.classList.add("selected");
					pressedButtons.push(14); // DPAD_LEFT
				} else {
					dpadLeft.classList.remove("selected");
				}
			}
			if (dpadRight) {
				const dPadPressed = gamepad.buttons[15] && gamepad.buttons[15].pressed;
				if (stickRight || dPadPressed) {
					dpadRight.classList.add("selected");
					pressedButtons.push(15); // DPAD_RIGHT
				} else {
					dpadRight.classList.remove("selected");
				}
			}
			
			// Highlight the mappings for pressed buttons
			pressedButtons.forEach(buttonIndex => {
				const mappings = document.querySelectorAll(".gamepad-mapping");
				mappings.forEach(mapping => {
					if (mapping.dataset.button === buttonIndex.toString()) {
						mapping.classList.add("highlighted");
					}
				});
			});
			
			break; // Only process the first connected gamepad
		}
	}

	start_gamepad_update_loop() {
		if (this.gamepadUpdateInterval) {
			clearInterval(this.gamepadUpdateInterval);
		}
		
		this.gamepadUpdateInterval = setInterval(() => {
			if (this.is_open) {
				this.update_gamepad_button_states();
			}
		}, 50); // Update 20 times per second
	}

	stop_gamepad_update_loop() {
		if (this.gamepadUpdateInterval) {
			clearInterval(this.gamepadUpdateInterval);
			this.gamepadUpdateInterval = null;
		}
		
		// Clear all selected states when modal closes (except manually selected ones)
		document.querySelectorAll(".gamepad-button.selected").forEach(button => {
			// Only remove if it's not the manually selected one
			if (button !== document.querySelector(".gamepad-button.selected[data-button]")) {
				button.classList.remove("selected");
			}
		});
	}

    refresh_languages() {
        document.querySelectorAll(".language-entry").forEach(entry => {
            entry.classList.remove("active");
        });

        const language = localStorage.getItem(LANG_KEY)

        let found = false
        if (language) {
            const el = document.getElementById(`lang-${language}`)
            if (el) {
                found = true
                el.classList.add('active')
            }
        }

        if (!found) {
            localStorage.setItem(LANG_KEY, "en")
            document.getElementById('lang-en').classList.add('active')
        }
    }

    handle_lang_entry_click(e) {
        const clicked_entry = e.target.closest(".language-entry");
        const lang_code = clicked_entry.dataset.lang;
        localStorage.setItem(LANG_KEY, lang_code)
        this.refresh_languages()
        window.dispatchEvent(new CustomEvent('updatelanguage'));
    }

    handle_bind_button_click(e) {
        const clicked_entry = e.target.closest(".keybind-button");

        document.querySelectorAll(".keybind-button").forEach(entry => {
            entry.classList.remove("active");
            entry.innerText = this.keybindings[parseInt(entry.dataset.key)]
        });

        clicked_entry.classList.add("active");
        clicked_entry.innerText = "> press a button <"
        this.selected_key = clicked_entry.dataset.key
    }

    handle_export_btn_click() {
        const save = this.get_save_file()
        if (save === null) {
            const elem = document.getElementById("export-error")
            elem.style.display = "block"
            elem.innerText = "ERROR: no save found."
            return;
        }

        const blob = new Blob([save], { type: "application/json" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        link.download = `lainTSX-save-${timestamp}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    handle_reset_btn_click(e) {
        const btn = e.target.closest("#reset-btn");
        const is_triggered = btn.dataset.triggered === "true"

        if (is_triggered) {
            localStorage.removeItem(SAVE_KEY)
            location.reload();
        } else {
            btn.dataset.triggered = true
            btn.innerText = "Are you sure? (Click again if yes)"
        }
    }

    handle_clear_storage_btn_click(e) {
        const btn = e.target.closest("#clear-storage-btn");
        const is_triggered = btn.dataset.triggered === "true"

        if (is_triggered) {
            localStorage.clear()
            location.reload();
        } else {
            btn.dataset.triggered = true
            btn.innerText = "Are you sure? (Click again if yes)"
        }
    }

    handle_keydown(key) {
        if (this.selected_key !== undefined) {
            if (key !== "Escape") {
                for (const [i, value] of this.keybindings.entries()) {
                    if (value === key.toLowerCase()) {
                        this.keybindings[i] = ''
                    }
                }

                this.keybindings[this.selected_key] = key.toLowerCase()
            }

            this.set_keybindings(this.keybindings)

            this.selected_key = undefined;
        }
        else if (key === "Escape") { this.close() }
    }

    import_save(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);

                localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));

                location.reload();
            } catch (err) {
                const elem = document.getElementById("import-error")
                elem.style.display = "block"
                elem.innerText = "ERROR: invalid save."
            }
        };
        reader.readAsText(file);
    }

	open() {
		this.modal.style.display = "flex";
		this.modal.classList.add("show");
		document.body.style.overflow = "hidden";
		this.is_open = true;

		// Start updating gamepad button states when modal opens
		this.start_gamepad_update_loop();

		window.dispatchEvent(new CustomEvent('opensettings'));
	}

	close() {
		this.modal.style.display = "none";
		this.modal.classList.remove("show");
		document.body.style.overflow = "auto";
		this.is_open = false;

		// Stop updating gamepad button states when modal closes
		this.stop_gamepad_update_loop();

		window.dispatchEvent(new CustomEvent('closesettings'));
	}
}

document.addEventListener("DOMContentLoaded", () => new Modal());
