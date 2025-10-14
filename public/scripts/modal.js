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
                        12: "Up",
                        13: "Down",
                        14: "Left",
                        15: "Right",
                        1: "Circle",
                        0: "Cross",
                        3: "Triangle",
                        2: "Square",
                        7: "R2",
                        6: "L2",
                        4: "L1",
                        5: "R1",
                        9: "Start",
                        8: "Select",
                }
        },
        {
                name: "Alternative",
                mappings: {
                        12: "Up",
                        13: "Down",
                        14: "Left",
                        15: "Right",
                        0: "Circle",
                        1: "Cross",
                        2: "Triangle",
                        3: "Square",
                        7: "R2",
                        6: "L2",
                        4: "L1",
                        5: "R1",
                        9: "Start",
                        8: "Select",
                }
        },
        {
                name: "Classic",
                mappings: {
                        12: "Up",
                        13: "Down",
                        14: "Left",
                        15: "Right",
                        2: "Circle",
                        1: "Cross",
                        3: "Triangle",
                        0: "Square",
                        7: "R2",
                        6: "L2",
                        4: "L1",
                        5: "R1",
                        9: "Start",
                        8: "Select",
                }
        }
]

class Modal {
        constructor() {
                this.modal = null;
                this.is_open = false;
                this.gamepad_layout = null;
                this.selected_gamepad_button = null;
                this.gamepad_update_interval = null;

                this.load_gamepad_layout();
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
                                const normalized_mappings = {};
                                if (parsed && parsed.mappings) {
                                        for (const [btn, val] of Object.entries(parsed.mappings)) {
                                                if (typeof val === "number") {
                                                        const key_name = Object.keys(Key).find((k) => Key[k] === val) || String(val);
                                                        normalized_mappings[btn] = key_name;
                                                } else {
                                                        normalized_mappings[btn] = val;
                                                }
                                        }
                                }

                                this.gamepad_layout = {
                                        name: parsed && parsed.name ? parsed.name : DEFAULT_GAMEPAD_LAYOUTS[0].name,
                                        mappings: Object.keys(normalized_mappings).length ? normalized_mappings : (parsed && parsed.mappings ? parsed.mappings : DEFAULT_GAMEPAD_LAYOUTS[0].mappings)
                                };
                        } catch (err) {
                                this.gamepad_layout = DEFAULT_GAMEPAD_LAYOUTS[0]
                        }
                } else {
                        this.gamepad_layout = DEFAULT_GAMEPAD_LAYOUTS[0]
                }
        }

        save_gamepad_layout(layout) {
                this.gamepad_layout = layout
                localStorage.setItem(GAMEPAD_LAYOUT_KEY, JSON.stringify(layout))
                window.dispatchEvent(new CustomEvent('updategamepadlayout', { detail: layout }));
        }

        refresh_gamepad_layout() {
                if (!this.gamepad_layout) {
                        return;
                }

                const mapping_list = document.getElementById("gamepad-mapping-list");
                if (!mapping_list) {
                        return;
                }

                document.querySelectorAll(".gamepad-layout-entry").forEach(entry => {
                        entry.classList.remove("active");
                });

                const active_layout = document.getElementById(`layout-${this.gamepad_layout.name.toLowerCase()}`);
                if (active_layout) {
                        active_layout.classList.add("active");
                }

                mapping_list.innerHTML = ""

                const action_descriptions = {
                        Up: "Go up",
                        Down: "Go down",
                        Left: "Go left",
                        Right: "Go right",
                        Cross: "Back",
                        Circle: "Confirm",
                        Triangle: "Menu",
                        Square: "Display node information",
                        L1: "Rotate left",
                        L2: "Open level selector",
                        R1: "Rotate right",
                        R2: "Look up/down",
                        Start: "Start/Proceed",
                        Select: "Menu"
                }

                Object.entries(this.gamepad_layout.mappings).forEach(([button, action]) => {
                        const mapping_div = document.createElement("div")
                        mapping_div.className = "gamepad-mapping"

                        const action_name = typeof action === "number"
                                ? (Object.keys(Key).find((k) => Key[k] === action) || String(action))
                                : action

                        mapping_div.dataset.action = action_name
                        mapping_div.dataset.button = button

                        const button_span = document.createElement("span")
                        button_span.className = "gamepad-mapping-button"
                        button_span.innerHTML = this.get_button_symbol(button)

                        const action_span = document.createElement("span")
                        action_span.className = "gamepad-mapping-action"
                        action_span.textContent = action_descriptions[action_name] || action_name

                        mapping_div.appendChild(button_span)
                        mapping_div.appendChild(action_span)
                        mapping_list.appendChild(mapping_div)

                        mapping_div.addEventListener("mouseenter", () => {
                                this.highlight_gamepad_button(button, true)
                        })

                        mapping_div.addEventListener("mouseleave", () => {
                                this.highlight_gamepad_button(button, false)
                        })
                })

                if (this.selected_gamepad_button !== null && this.selected_gamepad_button !== undefined) {
                        this.highlight_gamepad_mapping(this.selected_gamepad_button);
                }
        }

        get_button_symbol(button) {
                const button_symbols = {
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

                return button_symbols[button] || `${button}`
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
                                save_file_modal.style.display = 'none'
                                save_editor_modal.style.display = 'none'

                                document.querySelectorAll(".modal-tab").forEach(entry => {
                                        entry.classList.remove("active");
                                });

                                gamepad_tab.classList.add('active')
                                this.refresh_gamepad_layout()
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

        handle_gamepad_layout_change(e) {
                const clicked_entry = e.target.closest(".gamepad-layout-entry");
                if (!clicked_entry) {
                        return;
                }

                const layout_name = clicked_entry.dataset.layout;
                const layout = DEFAULT_GAMEPAD_LAYOUTS.find((entry) => entry.name === layout_name);
                if (layout) {
                        this.save_gamepad_layout(layout)
                        this.refresh_gamepad_layout()
                }
        }

        handle_gamepad_button_click(e) {
                const button = e.target.closest(".gamepad-button");
                if (!button) {
                        return;
                }

                const buttonIndex = parseInt(button.dataset.button, 10);

                document.querySelectorAll(".gamepad-button").forEach((btn) => {
                        btn.classList.remove("selected");
                });

                button.classList.add("selected");
                this.selected_gamepad_button = button_index;
                this.highlight_gamepad_mapping(button_index);
        }

        highlight_gamepad_button(button_index, highlight) {
                const button = document.querySelector(`.gamepad-button[data-button="${button_index}"]`);
                if (!button) {
                        return;
                }

                if (highlight) {
                        button.classList.add("highlighted");
                } else {
                        button.classList.remove("highlighted");
                }
        }

        highlight_gamepad_mapping(button_index) {
                const mappings = document.querySelectorAll(".gamepad-mapping");
                mappings.forEach((mapping) => {
                        mapping.classList.remove("highlighted");
                });

                const target = Array.from(mappings).find((entry) => entry.dataset.button === String(button_index));
                if (target) {
                        target.classList.add("highlighted");
                }
        }

        update_gamepad_button_states() {
                const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

                const status_info = document.getElementById("gamepad-status-info");
                if (status_info) {
                        let new_text = "Controller not initialized";
                        for (let i = 0; i < gamepads.length; i++) {
                                const gamepad = gamepads[i];
                                if (gamepad && gamepad.connected) {
                                        const match = gamepad.id.match(/^([^(]+)/);
                                        new_text = match ? match[1].trim() : gamepad.id;
                                        break;
                                }
                        }

                        if (status_info.textContent !== new_text) {
                                status_info.textContent = new_text;
                        }
                }

                document.querySelectorAll(".gamepad-mapping").forEach((mapping) => {
                        mapping.classList.remove("highlighted");
                });

                for (let i = 0; i < gamepads.length; i++) {
                        const gamepad = gamepads[i];
                        if (!gamepad || !gamepad.connected) {
                                continue;
                        }

                        const pressed_buttons = [];

                        document.querySelectorAll(".gamepad-button").forEach((button) => {
const button_index = parseInt(button.dataset.button, 10);
                                const is_pressed = gamepad.buttons[button_index] && gamepad.buttons[button_index].pressed;

                                if (!button.classList.contains("selected") || !is_pressed) {
                                        if (is_pressed) {
                                                button.classList.add("selected");
                                                pressed_buttons.push(button_index);
                                        } else {
                                                button.classList.remove("selected");
                                        }
                                } else if (is_pressed) {
                                        pressed_buttons.push(button_index);
                                }
                        });

                        const left_x = gamepad.axes[0];
                        const left_y = gamepad.axes[1];
                        const right_x = gamepad.axes[2];
                        const right_y = gamepad.axes[3];
                        const DEADZONE = 0.1;

                        const left_thumb = document.querySelector(".gamepad-stick.left .thumb");
                        const right_thumb = document.querySelector(".gamepad-stick.right .thumb");
                        const RADIUS = 28;

                        if (left_thumb) {
                                const lx = Math.abs(left_x) > DEADZONE ? left_x : 0;
                                const ly = Math.abs(left_y) > DEADZONE ? left_y : 0;
                                left_thumb.style.transform = `translate(calc(-50% + ${lx * RADIUS}px), calc(-50% + ${ly * RADIUS}px))`;
                        }

                        if (right_thumb) {
                                const rx = Math.abs(right_x) > DEADZONE ? right_x : 0;
                                const ry = Math.abs(right_y) > DEADZONE ? right_y : 0;
                                right_thumb.style.transform = `translate(calc(-50% + ${rx * RADIUS}px), calc(-50% + ${ry * RADIUS}px))`;
                        }

                        const stick_up = left_y < -DEADZONE;
                        const stick_down = left_y > DEADZONE;
                        const stick_left = left_x < -DEADZONE;
                        const stick_right = left_x > DEADZONE;

                        const dpad_up = document.querySelector(".gamepad-dpad-up");
                        const dpad_down = document.querySelector(".gamepad-dpad-down");
                        const dpad_left = document.querySelector(".gamepad-dpad-left");
                        const dpad_right = document.querySelector(".gamepad-dpad-right");

                        if (dpad_up) {
                                const dpad_pressed = gamepad.buttons[12] && gamepad.buttons[12].pressed;
                                if (stick_up || dpad_pressed) {
                                        dpad_up.classList.add("selected");
                                        pressed_buttons.push(12);
                                } else {
                                        dpad_up.classList.remove("selected");
                                }
                        }

                        if (dpad_down) {
                                const dpad_pressed = gamepad.buttons[13] && gamepad.buttons[13].pressed;
                                if (stick_down || dpad_pressed) {
                                        dpad_down.classList.add("selected");
                                        pressed_buttons.push(13);
                                } else {
                                        dpad_down.classList.remove("selected");
                                }
                        }

                        if (dpad_left) {
                                const dpad_pressed = gamepad.buttons[14] && gamepad.buttons[14].pressed;
                                if (stick_left || dpad_pressed) {
                                        dpad_left.classList.add("selected");
                                        pressed_buttons.push(14);
                                } else {
                                        dpad_left.classList.remove("selected");
                                }
                        }

                        if (dpad_right) {
                                const dpad_pressed = gamepad.buttons[15] && gamepad.buttons[15].pressed;
                                if (stick_right || dpad_pressed) {
                                        dpad_right.classList.add("selected");
                                        pressed_buttons.push(15);
                                } else {
                                        dpad_right.classList.remove("selected");
                                }
                        }

                        pressed_buttons.forEach((button_index) => {
                                const mapping = document.querySelector(`.gamepad-mapping[data-button="${button_index}"]`);
                                if (mapping) {
                                        mapping.classList.add("highlighted");
                                }
                        });

                        break;
                }
        }

start_gamepad_update_loop() {
                if (this.gamepad_update_interval) {
                        clearInterval(this.gamepad_update_interval);
                }
                
                if (this.is_open) {
                        this.gamepad_update_interval = setInterval(() => {
                                this.update_gamepad_button_states();
                        }, 50);
                }
        }

        stop_gamepad_update_loop() {
                if (this.gamepad_update_interval) {
                        clearInterval(this.gamepad_update_interval);
                        this.gamepad_update_interval = null;
                }
        }

        start_gamepad_update_loop() {
                if (this.gamepad_update_interval) {
                        clearInterval(this.gamepad_update_interval);
                }
                
                if (this.is_open) {
                        this.gamepad_update_interval = setInterval(() => {
                                this.update_gamepad_button_states();
                        }, 50);
                }
        }

        stop_gamepad_update_loop() {
                if (this.gamepad_update_interval) {
                        clearInterval(this.gamepad_update_interval);
                        this.gamepad_update_interval = null;
                }

                const manual_index = this.selected_gamepad_button;
                document.querySelectorAll(".gamepad-button").forEach((button) => {
                        const button_index = parseInt(button.dataset.button, 10);
                        if (manual_index === button_index) {
                                button.classList.add("selected");
                        } else {
                                button.classList.remove("selected");
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

                this.start_gamepad_update_loop();

                window.dispatchEvent(new CustomEvent('opensettings'));
        }

        close() {
                this.modal.style.display = "none";
                this.modal.classList.remove("show");
                document.body.style.overflow = "auto";
                this.is_open = false;

                this.stop_gamepad_update_loop();

                window.dispatchEvent(new CustomEvent('closesettings'));
        }
}

document.addEventListener("DOMContentLoaded", () => new Modal());
