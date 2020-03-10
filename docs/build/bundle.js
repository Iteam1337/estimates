
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const Roles = {
      Backend: {
        Description: 'A developer focusing on API\'s, data storage etc.',
        Rate: 1000,
      },
      'Data Scientist': {
        Description: '',
        Rate: 1000,
      },
      DevOps: {
        Description: 'Someone who works on the technical solutions for enabling continuous delivery and frequent releases.',
        Rate: 1000,
      },
      Frontend: {
        Description: 'A developer focusing on the user-facing end of products, such as mobile apps and web.',
        Rate: 1000,
      },
      TeamCoach: {
        Description: 'Usually a senior team member that looks at the broader perspective of team culture and well-being.',
        Rate: 1000,
      },
      UX: {
        Description: '',
        Rate: 1000,
      },
    };

    /* src/App.svelte generated by Svelte v3.19.2 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (76:2) {#if i+1 % 3 === 3}
    function create_if_block(ctx) {
    	let br;

    	const block = {
    		c: function create() {
    			br = element("br");
    			add_location(br, file, 76, 3, 922);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(76:2) {#if i+1 % 3 === 3}",
    		ctx
    	});

    	return block;
    }

    // (74:1) {#each Object.keys(Roles) as role, i}
    function create_each_block(ctx) {
    	let t0_value = /*role*/ ctx[14] + "";
    	let t0;
    	let t1;
    	let input;
    	let input_updating = false;
    	let t2;
    	let if_block_anchor;
    	let dispose;

    	function input_input_handler() {
    		input_updating = true;
    		/*input_input_handler*/ ctx[3].call(input, /*role*/ ctx[14]);
    	}

    	let if_block = /*i*/ ctx[16] + 1 % 3 === 3 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(": ");
    			input = element("input");
    			t2 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(input, "type", "number");
    			attr_dev(input, "class", "svelte-v1kkfr");
    			add_location(input, file, 74, 10, 845);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*estimate*/ ctx[0][/*role*/ ctx[14]]);
    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			dispose = listen_dev(input, "input", input_input_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!input_updating && dirty & /*estimate, Object, Roles*/ 1) {
    				set_input_value(input, /*estimate*/ ctx[0][/*role*/ ctx[14]]);
    			}

    			input_updating = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(74:1) {#each Object.keys(Roles) as role, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let hr0;
    	let t2;
    	let h2;
    	let t4;
    	let t5;
    	let hr1;
    	let t6;
    	let h30;
    	let t8;
    	let div0;
    	let button0;
    	let t10;
    	let button1;
    	let t12;
    	let div1;
    	let span0;
    	let t13;
    	let br0;
    	let t14;
    	let input0;
    	let input0_updating = false;
    	let br1;
    	let t15;
    	let input1;
    	let input1_updating = false;
    	let br2;
    	let t16;
    	let span1;
    	let t17;
    	let br3;
    	let t18;
    	let input2;
    	let input2_updating = false;
    	let br4;
    	let t19;
    	let input3;
    	let input3_updating = false;
    	let br5;
    	let t20;
    	let span2;
    	let t21;
    	let br6;
    	let t22;
    	let input4;
    	let input4_updating = false;
    	let br7;
    	let t23;
    	let input5;
    	let input5_updating = false;
    	let br8;
    	let t24;
    	let span3;
    	let t25;
    	let br9;
    	let t26;
    	let input6;
    	let input6_updating = false;
    	let br10;
    	let t27;
    	let input7;
    	let input7_updating = false;
    	let br11;
    	let t28;
    	let span4;
    	let t29;
    	let br12;
    	let t30;
    	let input8;
    	let input8_updating = false;
    	let br13;
    	let t31;
    	let input9;
    	let input9_updating = false;
    	let br14;
    	let t32;
    	let hr2;
    	let t33;
    	let h31;
    	let t35;
    	let p0;
    	let t41;
    	let p1;
    	let dispose;
    	let each_value = Object.keys(Roles);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function input0_input_handler() {
    		input0_updating = true;
    		/*input0_input_handler*/ ctx[4].call(input0);
    	}

    	function input1_input_handler() {
    		input1_updating = true;
    		/*input1_input_handler*/ ctx[5].call(input1);
    	}

    	function input2_input_handler() {
    		input2_updating = true;
    		/*input2_input_handler*/ ctx[6].call(input2);
    	}

    	function input3_input_handler() {
    		input3_updating = true;
    		/*input3_input_handler*/ ctx[7].call(input3);
    	}

    	function input4_input_handler() {
    		input4_updating = true;
    		/*input4_input_handler*/ ctx[8].call(input4);
    	}

    	function input5_input_handler() {
    		input5_updating = true;
    		/*input5_input_handler*/ ctx[9].call(input5);
    	}

    	function input6_input_handler() {
    		input6_updating = true;
    		/*input6_input_handler*/ ctx[10].call(input6);
    	}

    	function input7_input_handler() {
    		input7_updating = true;
    		/*input7_input_handler*/ ctx[11].call(input7);
    	}

    	function input8_input_handler() {
    		input8_updating = true;
    		/*input8_input_handler*/ ctx[12].call(input8);
    	}

    	function input9_input_handler() {
    		input9_updating = true;
    		/*input9_input_handler*/ ctx[13].call(input9);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Estimat";
    			t1 = space();
    			hr0 = element("hr");
    			t2 = space();
    			h2 = element("h2");
    			h2.textContent = "Roller";
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			hr1 = element("hr");
    			t6 = space();
    			h30 = element("h3");
    			h30.textContent = "Vecka";
    			t8 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Tick";
    			t10 = space();
    			button1 = element("button");
    			button1.textContent = "Tock";
    			t12 = space();
    			div1 = element("div");
    			span0 = element("span");
    			t13 = text("Måndag");
    			br0 = element("br");
    			t14 = space();
    			input0 = element("input");
    			br1 = element("br");
    			t15 = space();
    			input1 = element("input");
    			br2 = element("br");
    			t16 = space();
    			span1 = element("span");
    			t17 = text("Tisdag");
    			br3 = element("br");
    			t18 = space();
    			input2 = element("input");
    			br4 = element("br");
    			t19 = space();
    			input3 = element("input");
    			br5 = element("br");
    			t20 = space();
    			span2 = element("span");
    			t21 = text("Onsdag");
    			br6 = element("br");
    			t22 = space();
    			input4 = element("input");
    			br7 = element("br");
    			t23 = space();
    			input5 = element("input");
    			br8 = element("br");
    			t24 = space();
    			span3 = element("span");
    			t25 = text("Torsdag");
    			br9 = element("br");
    			t26 = space();
    			input6 = element("input");
    			br10 = element("br");
    			t27 = space();
    			input7 = element("input");
    			br11 = element("br");
    			t28 = space();
    			span4 = element("span");
    			t29 = text("Fredag");
    			br12 = element("br");
    			t30 = space();
    			input8 = element("input");
    			br13 = element("br");
    			t31 = space();
    			input9 = element("input");
    			br14 = element("br");
    			t32 = space();
    			hr2 = element("hr");
    			t33 = space();
    			h31 = element("h3");
    			h31.textContent = "Summering";
    			t35 = space();
    			p0 = element("p");

    			p0.textContent = `
		Valt team består av ${/*summary*/ ctx[2].roles} roller som lägger ${/*summary*/ ctx[2].hours} timmar i veckan.
	`;

    			t41 = space();
    			p1 = element("p");

    			p1.textContent = `
		Förväntad månadskostnad är ${/*summary*/ ctx[2].rate} kr i veckan.
	`;

    			attr_dev(h1, "class", "svelte-v1kkfr");
    			add_location(h1, file, 69, 1, 753);
    			add_location(hr0, file, 71, 1, 772);
    			add_location(h2, file, 72, 1, 780);
    			add_location(hr1, file, 80, 1, 948);
    			add_location(h30, file, 81, 1, 956);
    			add_location(button0, file, 83, 2, 980);
    			add_location(button1, file, 84, 2, 1004);
    			add_location(div0, file, 82, 1, 972);
    			add_location(br0, file, 88, 9, 1075);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "svelte-v1kkfr");
    			add_location(input0, file, 89, 3, 1085);
    			add_location(br1, file, 89, 57, 1139);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "svelte-v1kkfr");
    			add_location(input1, file, 90, 3, 1149);
    			add_location(br2, file, 90, 57, 1203);
    			attr_dev(span0, "class", "weekday svelte-v1kkfr");
    			add_location(span0, file, 87, 2, 1043);
    			add_location(br3, file, 93, 9, 1254);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "svelte-v1kkfr");
    			add_location(input2, file, 94, 3, 1264);
    			add_location(br4, file, 94, 57, 1318);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "svelte-v1kkfr");
    			add_location(input3, file, 95, 3, 1328);
    			add_location(br5, file, 95, 57, 1382);
    			attr_dev(span1, "class", "weekday svelte-v1kkfr");
    			add_location(span1, file, 92, 2, 1222);
    			add_location(br6, file, 98, 9, 1433);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "svelte-v1kkfr");
    			add_location(input4, file, 99, 3, 1443);
    			add_location(br7, file, 99, 57, 1497);
    			attr_dev(input5, "type", "number");
    			attr_dev(input5, "class", "svelte-v1kkfr");
    			add_location(input5, file, 100, 3, 1507);
    			add_location(br8, file, 100, 57, 1561);
    			attr_dev(span2, "class", "weekday svelte-v1kkfr");
    			add_location(span2, file, 97, 2, 1401);
    			add_location(br9, file, 103, 10, 1613);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "svelte-v1kkfr");
    			add_location(input6, file, 104, 3, 1623);
    			add_location(br10, file, 104, 57, 1677);
    			attr_dev(input7, "type", "number");
    			attr_dev(input7, "class", "svelte-v1kkfr");
    			add_location(input7, file, 105, 3, 1687);
    			add_location(br11, file, 105, 57, 1741);
    			attr_dev(span3, "class", "weekday svelte-v1kkfr");
    			add_location(span3, file, 102, 2, 1580);
    			add_location(br12, file, 108, 9, 1792);
    			attr_dev(input8, "type", "number");
    			attr_dev(input8, "class", "svelte-v1kkfr");
    			add_location(input8, file, 109, 3, 1802);
    			add_location(br13, file, 109, 57, 1856);
    			attr_dev(input9, "type", "number");
    			attr_dev(input9, "class", "svelte-v1kkfr");
    			add_location(input9, file, 110, 3, 1866);
    			add_location(br14, file, 110, 57, 1920);
    			attr_dev(span4, "class", "weekday svelte-v1kkfr");
    			add_location(span4, file, 107, 2, 1760);
    			add_location(div1, file, 86, 1, 1035);
    			add_location(hr2, file, 114, 1, 1947);
    			add_location(h31, file, 115, 1, 1955);
    			add_location(p0, file, 116, 1, 1975);
    			add_location(p1, file, 119, 1, 2075);
    			attr_dev(main, "class", "svelte-v1kkfr");
    			add_location(main, file, 68, 0, 745);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, hr0);
    			append_dev(main, t2);
    			append_dev(main, h2);
    			append_dev(main, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			append_dev(main, t5);
    			append_dev(main, hr1);
    			append_dev(main, t6);
    			append_dev(main, h30);
    			append_dev(main, t8);
    			append_dev(main, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t10);
    			append_dev(div0, button1);
    			append_dev(main, t12);
    			append_dev(main, div1);
    			append_dev(div1, span0);
    			append_dev(span0, t13);
    			append_dev(span0, br0);
    			append_dev(span0, t14);
    			append_dev(span0, input0);
    			set_input_value(input0, /*week*/ ctx[1].mon.am.hours);
    			append_dev(span0, br1);
    			append_dev(span0, t15);
    			append_dev(span0, input1);
    			set_input_value(input1, /*week*/ ctx[1].mon.pm.hours);
    			append_dev(span0, br2);
    			append_dev(div1, t16);
    			append_dev(div1, span1);
    			append_dev(span1, t17);
    			append_dev(span1, br3);
    			append_dev(span1, t18);
    			append_dev(span1, input2);
    			set_input_value(input2, /*week*/ ctx[1].tue.am.hours);
    			append_dev(span1, br4);
    			append_dev(span1, t19);
    			append_dev(span1, input3);
    			set_input_value(input3, /*week*/ ctx[1].tue.pm.hours);
    			append_dev(span1, br5);
    			append_dev(div1, t20);
    			append_dev(div1, span2);
    			append_dev(span2, t21);
    			append_dev(span2, br6);
    			append_dev(span2, t22);
    			append_dev(span2, input4);
    			set_input_value(input4, /*week*/ ctx[1].wed.am.hours);
    			append_dev(span2, br7);
    			append_dev(span2, t23);
    			append_dev(span2, input5);
    			set_input_value(input5, /*week*/ ctx[1].wed.pm.hours);
    			append_dev(span2, br8);
    			append_dev(div1, t24);
    			append_dev(div1, span3);
    			append_dev(span3, t25);
    			append_dev(span3, br9);
    			append_dev(span3, t26);
    			append_dev(span3, input6);
    			set_input_value(input6, /*week*/ ctx[1].thu.am.hours);
    			append_dev(span3, br10);
    			append_dev(span3, t27);
    			append_dev(span3, input7);
    			set_input_value(input7, /*week*/ ctx[1].thu.pm.hours);
    			append_dev(span3, br11);
    			append_dev(div1, t28);
    			append_dev(div1, span4);
    			append_dev(span4, t29);
    			append_dev(span4, br12);
    			append_dev(span4, t30);
    			append_dev(span4, input8);
    			set_input_value(input8, /*week*/ ctx[1].fri.am.hours);
    			append_dev(span4, br13);
    			append_dev(span4, t31);
    			append_dev(span4, input9);
    			set_input_value(input9, /*week*/ ctx[1].fri.pm.hours);
    			append_dev(span4, br14);
    			append_dev(main, t32);
    			append_dev(main, hr2);
    			append_dev(main, t33);
    			append_dev(main, h31);
    			append_dev(main, t35);
    			append_dev(main, p0);
    			append_dev(main, t41);
    			append_dev(main, p1);

    			dispose = [
    				listen_dev(input0, "input", input0_input_handler),
    				listen_dev(input1, "input", input1_input_handler),
    				listen_dev(input2, "input", input2_input_handler),
    				listen_dev(input3, "input", input3_input_handler),
    				listen_dev(input4, "input", input4_input_handler),
    				listen_dev(input5, "input", input5_input_handler),
    				listen_dev(input6, "input", input6_input_handler),
    				listen_dev(input7, "input", input7_input_handler),
    				listen_dev(input8, "input", input8_input_handler),
    				listen_dev(input9, "input", input9_input_handler)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*estimate, Object, Roles*/ 1) {
    				each_value = Object.keys(Roles);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, t5);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!input0_updating && dirty & /*week*/ 2) {
    				set_input_value(input0, /*week*/ ctx[1].mon.am.hours);
    			}

    			input0_updating = false;

    			if (!input1_updating && dirty & /*week*/ 2) {
    				set_input_value(input1, /*week*/ ctx[1].mon.pm.hours);
    			}

    			input1_updating = false;

    			if (!input2_updating && dirty & /*week*/ 2) {
    				set_input_value(input2, /*week*/ ctx[1].tue.am.hours);
    			}

    			input2_updating = false;

    			if (!input3_updating && dirty & /*week*/ 2) {
    				set_input_value(input3, /*week*/ ctx[1].tue.pm.hours);
    			}

    			input3_updating = false;

    			if (!input4_updating && dirty & /*week*/ 2) {
    				set_input_value(input4, /*week*/ ctx[1].wed.am.hours);
    			}

    			input4_updating = false;

    			if (!input5_updating && dirty & /*week*/ 2) {
    				set_input_value(input5, /*week*/ ctx[1].wed.pm.hours);
    			}

    			input5_updating = false;

    			if (!input6_updating && dirty & /*week*/ 2) {
    				set_input_value(input6, /*week*/ ctx[1].thu.am.hours);
    			}

    			input6_updating = false;

    			if (!input7_updating && dirty & /*week*/ 2) {
    				set_input_value(input7, /*week*/ ctx[1].thu.pm.hours);
    			}

    			input7_updating = false;

    			if (!input8_updating && dirty & /*week*/ 2) {
    				set_input_value(input8, /*week*/ ctx[1].fri.am.hours);
    			}

    			input8_updating = false;

    			if (!input9_updating && dirty & /*week*/ 2) {
    				set_input_value(input9, /*week*/ ctx[1].fri.pm.hours);
    			}

    			input9_updating = false;
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const estimate = {};

    	Object.keys(Roles).forEach(role => {
    		$$invalidate(0, estimate[role] = 0, estimate);
    	});

    	const week = {
    		mon: {
    			am: { tt: "tick", hours: 0 },
    			pm: { tt: "tick", hours: 0 }
    		},
    		tue: {
    			am: { tt: "tick", hours: 0 },
    			pm: { tt: "tick", hours: 0 }
    		},
    		wed: {
    			am: { tt: "tick", hours: 0 },
    			pm: { tt: "tock", hours: 0 }
    		},
    		thu: {
    			am: { tt: "tock", hours: 0 },
    			pm: { tt: "tock", hours: 0 }
    		},
    		fri: {
    			am: { tt: "tock", hours: 0 },
    			pm: { tt: "tock", hours: 0 }
    		}
    	};

    	const summary = { roles: 0, hours: 0, rate: 0 };
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input_input_handler(role) {
    		estimate[role] = to_number(this.value);
    		$$invalidate(0, estimate);
    	}

    	function input0_input_handler() {
    		week.mon.am.hours = to_number(this.value);
    		$$invalidate(1, week);
    	}

    	function input1_input_handler() {
    		week.mon.pm.hours = to_number(this.value);
    		$$invalidate(1, week);
    	}

    	function input2_input_handler() {
    		week.tue.am.hours = to_number(this.value);
    		$$invalidate(1, week);
    	}

    	function input3_input_handler() {
    		week.tue.pm.hours = to_number(this.value);
    		$$invalidate(1, week);
    	}

    	function input4_input_handler() {
    		week.wed.am.hours = to_number(this.value);
    		$$invalidate(1, week);
    	}

    	function input5_input_handler() {
    		week.wed.pm.hours = to_number(this.value);
    		$$invalidate(1, week);
    	}

    	function input6_input_handler() {
    		week.thu.am.hours = to_number(this.value);
    		$$invalidate(1, week);
    	}

    	function input7_input_handler() {
    		week.thu.pm.hours = to_number(this.value);
    		$$invalidate(1, week);
    	}

    	function input8_input_handler() {
    		week.fri.am.hours = to_number(this.value);
    		$$invalidate(1, week);
    	}

    	function input9_input_handler() {
    		week.fri.pm.hours = to_number(this.value);
    		$$invalidate(1, week);
    	}

    	$$self.$capture_state = () => ({ Roles, estimate, week, summary });

    	return [
    		estimate,
    		week,
    		summary,
    		input_input_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_input_handler,
    		input9_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
