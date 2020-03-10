
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
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
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

    /* src/WeekBlocks.svelte generated by Svelte v3.19.2 */
    const file = "src/WeekBlocks.svelte";

    function create_fragment(ctx) {
    	let span0;
    	let t0;
    	let br0;
    	let t1;
    	let input0;
    	let br1;
    	let t2;
    	let input1;
    	let br2;
    	let t3;
    	let span1;
    	let t4;
    	let br3;
    	let t5;
    	let input2;
    	let br4;
    	let t6;
    	let input3;
    	let br5;
    	let t7;
    	let span2;
    	let t8;
    	let br6;
    	let t9;
    	let input4;
    	let br7;
    	let t10;
    	let input5;
    	let br8;
    	let t11;
    	let span3;
    	let t12;
    	let br9;
    	let t13;
    	let input6;
    	let br10;
    	let t14;
    	let input7;
    	let br11;
    	let t15;
    	let span4;
    	let t16;
    	let br12;
    	let t17;
    	let input8;
    	let br13;
    	let t18;
    	let input9;
    	let br14;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text("Måndag");
    			br0 = element("br");
    			t1 = space();
    			input0 = element("input");
    			br1 = element("br");
    			t2 = space();
    			input1 = element("input");
    			br2 = element("br");
    			t3 = space();
    			span1 = element("span");
    			t4 = text("Tisdag");
    			br3 = element("br");
    			t5 = space();
    			input2 = element("input");
    			br4 = element("br");
    			t6 = space();
    			input3 = element("input");
    			br5 = element("br");
    			t7 = space();
    			span2 = element("span");
    			t8 = text("Onsdag");
    			br6 = element("br");
    			t9 = space();
    			input4 = element("input");
    			br7 = element("br");
    			t10 = space();
    			input5 = element("input");
    			br8 = element("br");
    			t11 = space();
    			span3 = element("span");
    			t12 = text("Torsdag");
    			br9 = element("br");
    			t13 = space();
    			input6 = element("input");
    			br10 = element("br");
    			t14 = space();
    			input7 = element("input");
    			br11 = element("br");
    			t15 = space();
    			span4 = element("span");
    			t16 = text("Fredag");
    			br12 = element("br");
    			t17 = space();
    			input8 = element("input");
    			br13 = element("br");
    			t18 = space();
    			input9 = element("input");
    			br14 = element("br");
    			add_location(br0, file, 13, 8, 254);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file, 14, 2, 263);
    			add_location(br1, file, 14, 73, 334);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file, 15, 2, 343);
    			add_location(br2, file, 15, 73, 414);
    			attr_dev(span0, "class", "weekday svelte-6nv61i");
    			add_location(span0, file, 12, 0, 223);
    			add_location(br3, file, 18, 8, 460);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file, 19, 2, 469);
    			add_location(br4, file, 19, 73, 540);
    			attr_dev(input3, "type", "checkbox");
    			add_location(input3, file, 20, 2, 549);
    			add_location(br5, file, 20, 73, 620);
    			attr_dev(span1, "class", "weekday svelte-6nv61i");
    			add_location(span1, file, 17, 0, 429);
    			add_location(br6, file, 23, 8, 666);
    			attr_dev(input4, "type", "checkbox");
    			add_location(input4, file, 24, 2, 675);
    			add_location(br7, file, 24, 73, 746);
    			attr_dev(input5, "type", "checkbox");
    			add_location(input5, file, 25, 2, 755);
    			add_location(br8, file, 25, 73, 826);
    			attr_dev(span2, "class", "weekday svelte-6nv61i");
    			add_location(span2, file, 22, 0, 635);
    			add_location(br9, file, 28, 9, 873);
    			attr_dev(input6, "type", "checkbox");
    			add_location(input6, file, 29, 2, 882);
    			add_location(br10, file, 29, 73, 953);
    			attr_dev(input7, "type", "checkbox");
    			add_location(input7, file, 30, 2, 962);
    			add_location(br11, file, 30, 73, 1033);
    			attr_dev(span3, "class", "weekday svelte-6nv61i");
    			add_location(span3, file, 27, 0, 841);
    			add_location(br12, file, 33, 8, 1079);
    			attr_dev(input8, "type", "checkbox");
    			add_location(input8, file, 34, 2, 1088);
    			add_location(br13, file, 34, 73, 1159);
    			attr_dev(input9, "type", "checkbox");
    			add_location(input9, file, 35, 2, 1168);
    			add_location(br14, file, 35, 73, 1239);
    			attr_dev(span4, "class", "weekday svelte-6nv61i");
    			add_location(span4, file, 32, 0, 1048);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			append_dev(span0, br0);
    			append_dev(span0, t1);
    			append_dev(span0, input0);
    			input0.checked = /*week*/ ctx[0].mon.am;
    			append_dev(span0, br1);
    			append_dev(span0, t2);
    			append_dev(span0, input1);
    			input1.checked = /*week*/ ctx[0].mon.pm;
    			append_dev(span0, br2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t4);
    			append_dev(span1, br3);
    			append_dev(span1, t5);
    			append_dev(span1, input2);
    			input2.checked = /*week*/ ctx[0].tue.am;
    			append_dev(span1, br4);
    			append_dev(span1, t6);
    			append_dev(span1, input3);
    			input3.checked = /*week*/ ctx[0].tue.pm;
    			append_dev(span1, br5);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t8);
    			append_dev(span2, br6);
    			append_dev(span2, t9);
    			append_dev(span2, input4);
    			input4.checked = /*week*/ ctx[0].wed.am;
    			append_dev(span2, br7);
    			append_dev(span2, t10);
    			append_dev(span2, input5);
    			input5.checked = /*week*/ ctx[0].wed.pm;
    			append_dev(span2, br8);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, span3, anchor);
    			append_dev(span3, t12);
    			append_dev(span3, br9);
    			append_dev(span3, t13);
    			append_dev(span3, input6);
    			input6.checked = /*week*/ ctx[0].thu.am;
    			append_dev(span3, br10);
    			append_dev(span3, t14);
    			append_dev(span3, input7);
    			input7.checked = /*week*/ ctx[0].thu.pm;
    			append_dev(span3, br11);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, span4, anchor);
    			append_dev(span4, t16);
    			append_dev(span4, br12);
    			append_dev(span4, t17);
    			append_dev(span4, input8);
    			input8.checked = /*week*/ ctx[0].fri.am;
    			append_dev(span4, br13);
    			append_dev(span4, t18);
    			append_dev(span4, input9);
    			input9.checked = /*week*/ ctx[0].fri.pm;
    			append_dev(span4, br14);

    			dispose = [
    				listen_dev(input0, "change", /*input0_change_handler*/ ctx[3]),
    				listen_dev(input0, "change", /*change*/ ctx[1], false, false, false),
    				listen_dev(input1, "change", /*input1_change_handler*/ ctx[4]),
    				listen_dev(input1, "change", /*change*/ ctx[1], false, false, false),
    				listen_dev(input2, "change", /*input2_change_handler*/ ctx[5]),
    				listen_dev(input2, "change", /*change*/ ctx[1], false, false, false),
    				listen_dev(input3, "change", /*input3_change_handler*/ ctx[6]),
    				listen_dev(input3, "change", /*change*/ ctx[1], false, false, false),
    				listen_dev(input4, "change", /*input4_change_handler*/ ctx[7]),
    				listen_dev(input4, "change", /*change*/ ctx[1], false, false, false),
    				listen_dev(input5, "change", /*input5_change_handler*/ ctx[8]),
    				listen_dev(input5, "change", /*change*/ ctx[1], false, false, false),
    				listen_dev(input6, "change", /*input6_change_handler*/ ctx[9]),
    				listen_dev(input6, "change", /*change*/ ctx[1], false, false, false),
    				listen_dev(input7, "change", /*input7_change_handler*/ ctx[10]),
    				listen_dev(input7, "change", /*change*/ ctx[1], false, false, false),
    				listen_dev(input8, "change", /*input8_change_handler*/ ctx[11]),
    				listen_dev(input8, "change", /*change*/ ctx[1], false, false, false),
    				listen_dev(input9, "change", /*input9_change_handler*/ ctx[12]),
    				listen_dev(input9, "change", /*change*/ ctx[1], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*week*/ 1) {
    				input0.checked = /*week*/ ctx[0].mon.am;
    			}

    			if (dirty & /*week*/ 1) {
    				input1.checked = /*week*/ ctx[0].mon.pm;
    			}

    			if (dirty & /*week*/ 1) {
    				input2.checked = /*week*/ ctx[0].tue.am;
    			}

    			if (dirty & /*week*/ 1) {
    				input3.checked = /*week*/ ctx[0].tue.pm;
    			}

    			if (dirty & /*week*/ 1) {
    				input4.checked = /*week*/ ctx[0].wed.am;
    			}

    			if (dirty & /*week*/ 1) {
    				input5.checked = /*week*/ ctx[0].wed.pm;
    			}

    			if (dirty & /*week*/ 1) {
    				input6.checked = /*week*/ ctx[0].thu.am;
    			}

    			if (dirty & /*week*/ 1) {
    				input7.checked = /*week*/ ctx[0].thu.pm;
    			}

    			if (dirty & /*week*/ 1) {
    				input8.checked = /*week*/ ctx[0].fri.am;
    			}

    			if (dirty & /*week*/ 1) {
    				input9.checked = /*week*/ ctx[0].fri.pm;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(span4);
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
    	let { week } = $$props;
    	const dispatch = createEventDispatcher();

    	const change = e => {
    		// TODO: Validate input.
    		dispatch("estimateUpdated", {});
    	};

    	const writable_props = ["week"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WeekBlocks> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("WeekBlocks", $$slots, []);

    	function input0_change_handler() {
    		week.mon.am = this.checked;
    		$$invalidate(0, week);
    	}

    	function input1_change_handler() {
    		week.mon.pm = this.checked;
    		$$invalidate(0, week);
    	}

    	function input2_change_handler() {
    		week.tue.am = this.checked;
    		$$invalidate(0, week);
    	}

    	function input3_change_handler() {
    		week.tue.pm = this.checked;
    		$$invalidate(0, week);
    	}

    	function input4_change_handler() {
    		week.wed.am = this.checked;
    		$$invalidate(0, week);
    	}

    	function input5_change_handler() {
    		week.wed.pm = this.checked;
    		$$invalidate(0, week);
    	}

    	function input6_change_handler() {
    		week.thu.am = this.checked;
    		$$invalidate(0, week);
    	}

    	function input7_change_handler() {
    		week.thu.pm = this.checked;
    		$$invalidate(0, week);
    	}

    	function input8_change_handler() {
    		week.fri.am = this.checked;
    		$$invalidate(0, week);
    	}

    	function input9_change_handler() {
    		week.fri.pm = this.checked;
    		$$invalidate(0, week);
    	}

    	$$self.$set = $$props => {
    		if ("week" in $$props) $$invalidate(0, week = $$props.week);
    	};

    	$$self.$capture_state = () => ({
    		week,
    		createEventDispatcher,
    		dispatch,
    		change
    	});

    	$$self.$inject_state = $$props => {
    		if ("week" in $$props) $$invalidate(0, week = $$props.week);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		week,
    		change,
    		dispatch,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler,
    		input4_change_handler,
    		input5_change_handler,
    		input6_change_handler,
    		input7_change_handler,
    		input8_change_handler,
    		input9_change_handler
    	];
    }

    class WeekBlocks extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { week: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WeekBlocks",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*week*/ ctx[0] === undefined && !("week" in props)) {
    			console.warn("<WeekBlocks> was created without expected prop 'week'");
    		}
    	}

    	get week() {
    		throw new Error("<WeekBlocks>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set week(value) {
    		throw new Error("<WeekBlocks>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Plan.svelte generated by Svelte v3.19.2 */
    const file$1 = "src/Plan.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (20:0) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Lägg till roller i ditt team för att börja titta på hur veckorna kan se ut.";
    			add_location(p, file$1, 20, 2, 446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(20:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:0) {#if team.length}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*team*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*team, estimateUpdated*/ 3) {
    				each_value = /*team*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(14:0) {#if team.length}",
    		ctx
    	});

    	return block;
    }

    // (15:2) {#each team as member}
    function create_each_block(ctx) {
    	let h3;
    	let t0_value = /*member*/ ctx[3].role + "";
    	let t0;
    	let t1;
    	let t2;
    	let br;
    	let current;

    	const weekblocks = new WeekBlocks({
    			props: { week: /*member*/ ctx[3].week },
    			$$inline: true
    		});

    	weekblocks.$on("estimateUpdated", /*estimateUpdated*/ ctx[1]);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(weekblocks.$$.fragment);
    			t2 = space();
    			br = element("br");
    			add_location(h3, file$1, 15, 4, 317);
    			add_location(br, file$1, 17, 4, 419);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			mount_component(weekblocks, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*team*/ 1) && t0_value !== (t0_value = /*member*/ ctx[3].role + "")) set_data_dev(t0, t0_value);
    			const weekblocks_changes = {};
    			if (dirty & /*team*/ 1) weekblocks_changes.week = /*member*/ ctx[3].week;
    			weekblocks.$set(weekblocks_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(weekblocks.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(weekblocks.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_component(weekblocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(15:2) {#each team as member}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*team*/ ctx[0].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const selected = 0;

    function instance$1($$self, $$props, $$invalidate) {
    	let { team } = $$props;
    	const dispatch = createEventDispatcher();

    	const estimateUpdated = () => {
    		dispatch("estimateUpdated", {});
    	};

    	const writable_props = ["team"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Plan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Plan", $$slots, []);

    	$$self.$set = $$props => {
    		if ("team" in $$props) $$invalidate(0, team = $$props.team);
    	};

    	$$self.$capture_state = () => ({
    		team,
    		WeekBlocks,
    		selected,
    		createEventDispatcher,
    		dispatch,
    		estimateUpdated
    	});

    	$$self.$inject_state = $$props => {
    		if ("team" in $$props) $$invalidate(0, team = $$props.team);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [team, estimateUpdated];
    }

    class Plan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { team: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Plan",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*team*/ ctx[0] === undefined && !("team" in props)) {
    			console.warn("<Plan> was created without expected prop 'team'");
    		}
    	}

    	get team() {
    		throw new Error("<Plan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set team(value) {
    		throw new Error("<Plan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Summary.svelte generated by Svelte v3.19.2 */

    const file$2 = "src/Summary.svelte";

    // (5:0) {#if summary.roles > 0 && summary.hours > 0}
    function create_if_block$1(ctx) {
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*summary*/ ctx[0].roles + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*summary*/ ctx[0].hours + "";
    	let t3;
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let span2;
    	let t7_value = /*summary*/ ctx[0].rate + "";
    	let t7;
    	let t8;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Valt team består av ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = text(" roller som tillsammans lägger ");
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text(" timmar i veckan.");
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Förväntad månadskostnad är ");
    			span2 = element("span");
    			t7 = text(t7_value);
    			t8 = text(" kr i veckan.");
    			attr_dev(span0, "class", "highlight svelte-epcfm5");
    			add_location(span0, file$2, 6, 24, 116);
    			attr_dev(span1, "class", "highlight svelte-epcfm5");
    			add_location(span1, file$2, 6, 101, 193);
    			add_location(p0, file$2, 5, 2, 88);
    			attr_dev(span2, "class", "highlight svelte-epcfm5");
    			add_location(span2, file$2, 9, 31, 301);
    			add_location(p1, file$2, 8, 2, 266);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, span0);
    			append_dev(span0, t1);
    			append_dev(p0, t2);
    			append_dev(p0, span1);
    			append_dev(span1, t3);
    			append_dev(p0, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t6);
    			append_dev(p1, span2);
    			append_dev(span2, t7);
    			append_dev(p1, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*summary*/ 1 && t1_value !== (t1_value = /*summary*/ ctx[0].roles + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*summary*/ 1 && t3_value !== (t3_value = /*summary*/ ctx[0].hours + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*summary*/ 1 && t7_value !== (t7_value = /*summary*/ ctx[0].rate + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(5:0) {#if summary.roles > 0 && summary.hours > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*summary*/ ctx[0].roles > 0 && /*summary*/ ctx[0].hours > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*summary*/ ctx[0].roles > 0 && /*summary*/ ctx[0].hours > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { summary } = $$props;
    	const writable_props = ["summary"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Summary> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Summary", $$slots, []);

    	$$self.$set = $$props => {
    		if ("summary" in $$props) $$invalidate(0, summary = $$props.summary);
    	};

    	$$self.$capture_state = () => ({ summary });

    	$$self.$inject_state = $$props => {
    		if ("summary" in $$props) $$invalidate(0, summary = $$props.summary);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [summary];
    }

    class Summary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { summary: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Summary",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*summary*/ ctx[0] === undefined && !("summary" in props)) {
    			console.warn("<Summary> was created without expected prop 'summary'");
    		}
    	}

    	get summary() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set summary(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Team.svelte generated by Svelte v3.19.2 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/Team.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (17:0) {#each Object.keys(roles) as role}
    function create_each_block$1(ctx) {
    	let button;
    	let t_value = /*role*/ ctx[4] + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*role*/ ctx[4], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "available svelte-1hmaiig");
    			add_location(button, file$3, 17, 1, 300);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    			dispose = listen_dev(button, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*roles*/ 1 && t_value !== (t_value = /*role*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(17:0) {#each Object.keys(roles) as role}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let p;
    	let t1;
    	let each_1_anchor;
    	let each_value = Object.keys(/*roles*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Klicka på önskade roller för att lägga till dem i teamet.";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(p, file$3, 13, 0, 196);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*add, Object, roles*/ 3) {
    				each_value = Object.keys(/*roles*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { roles } = $$props;
    	const dispatch = createEventDispatcher();

    	const add = role => {
    		dispatch("addRole", { role });
    	};

    	const writable_props = ["roles"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Team> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Team", $$slots, []);

    	const click_handler = role => {
    		add(role);
    	};

    	$$self.$set = $$props => {
    		if ("roles" in $$props) $$invalidate(0, roles = $$props.roles);
    	};

    	$$self.$capture_state = () => ({
    		roles,
    		createEventDispatcher,
    		dispatch,
    		add
    	});

    	$$self.$inject_state = $$props => {
    		if ("roles" in $$props) $$invalidate(0, roles = $$props.roles);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [roles, add, dispatch, click_handler];
    }

    class Team extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { roles: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Team",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*roles*/ ctx[0] === undefined && !("roles" in props)) {
    			console.warn("<Team> was created without expected prop 'roles'");
    		}
    	}

    	get roles() {
    		throw new Error("<Team>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set roles(value) {
    		throw new Error("<Team>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Week.svelte generated by Svelte v3.19.2 */
    const file$4 = "src/Week.svelte";

    function create_fragment$4(ctx) {
    	let span0;
    	let t0;
    	let br0;
    	let t1;
    	let input0;
    	let input0_updating = false;
    	let br1;
    	let t2;
    	let input1;
    	let input1_updating = false;
    	let br2;
    	let t3;
    	let span1;
    	let t4;
    	let br3;
    	let t5;
    	let input2;
    	let input2_updating = false;
    	let br4;
    	let t6;
    	let input3;
    	let input3_updating = false;
    	let br5;
    	let t7;
    	let span2;
    	let t8;
    	let br6;
    	let t9;
    	let input4;
    	let input4_updating = false;
    	let br7;
    	let t10;
    	let input5;
    	let input5_updating = false;
    	let br8;
    	let t11;
    	let span3;
    	let t12;
    	let br9;
    	let t13;
    	let input6;
    	let input6_updating = false;
    	let br10;
    	let t14;
    	let input7;
    	let input7_updating = false;
    	let br11;
    	let t15;
    	let span4;
    	let t16;
    	let br12;
    	let t17;
    	let input8;
    	let input8_updating = false;
    	let br13;
    	let t18;
    	let input9;
    	let input9_updating = false;
    	let br14;
    	let dispose;

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
    			span0 = element("span");
    			t0 = text("Måndag");
    			br0 = element("br");
    			t1 = space();
    			input0 = element("input");
    			br1 = element("br");
    			t2 = space();
    			input1 = element("input");
    			br2 = element("br");
    			t3 = space();
    			span1 = element("span");
    			t4 = text("Tisdag");
    			br3 = element("br");
    			t5 = space();
    			input2 = element("input");
    			br4 = element("br");
    			t6 = space();
    			input3 = element("input");
    			br5 = element("br");
    			t7 = space();
    			span2 = element("span");
    			t8 = text("Onsdag");
    			br6 = element("br");
    			t9 = space();
    			input4 = element("input");
    			br7 = element("br");
    			t10 = space();
    			input5 = element("input");
    			br8 = element("br");
    			t11 = space();
    			span3 = element("span");
    			t12 = text("Torsdag");
    			br9 = element("br");
    			t13 = space();
    			input6 = element("input");
    			br10 = element("br");
    			t14 = space();
    			input7 = element("input");
    			br11 = element("br");
    			t15 = space();
    			span4 = element("span");
    			t16 = text("Fredag");
    			br12 = element("br");
    			t17 = space();
    			input8 = element("input");
    			br13 = element("br");
    			t18 = space();
    			input9 = element("input");
    			br14 = element("br");
    			add_location(br0, file$4, 14, 8, 282);
    			attr_dev(input0, "type", "number");
    			input0.readOnly = /*readonly*/ ctx[1];
    			attr_dev(input0, "class", "svelte-1i3eer7");
    			add_location(input0, file$4, 15, 2, 291);
    			add_location(br1, file$4, 15, 102, 391);
    			attr_dev(input1, "type", "number");
    			input1.readOnly = /*readonly*/ ctx[1];
    			attr_dev(input1, "class", "svelte-1i3eer7");
    			add_location(input1, file$4, 16, 2, 400);
    			add_location(br2, file$4, 16, 102, 500);
    			attr_dev(span0, "class", "weekday svelte-1i3eer7");
    			add_location(span0, file$4, 13, 0, 251);
    			add_location(br3, file$4, 19, 8, 546);
    			attr_dev(input2, "type", "number");
    			input2.readOnly = /*readonly*/ ctx[1];
    			attr_dev(input2, "class", "svelte-1i3eer7");
    			add_location(input2, file$4, 20, 2, 555);
    			add_location(br4, file$4, 20, 102, 655);
    			attr_dev(input3, "type", "number");
    			input3.readOnly = /*readonly*/ ctx[1];
    			attr_dev(input3, "class", "svelte-1i3eer7");
    			add_location(input3, file$4, 21, 2, 664);
    			add_location(br5, file$4, 21, 102, 764);
    			attr_dev(span1, "class", "weekday svelte-1i3eer7");
    			add_location(span1, file$4, 18, 0, 515);
    			add_location(br6, file$4, 24, 8, 810);
    			attr_dev(input4, "type", "number");
    			input4.readOnly = /*readonly*/ ctx[1];
    			attr_dev(input4, "class", "svelte-1i3eer7");
    			add_location(input4, file$4, 25, 2, 819);
    			add_location(br7, file$4, 25, 102, 919);
    			attr_dev(input5, "type", "number");
    			input5.readOnly = /*readonly*/ ctx[1];
    			attr_dev(input5, "class", "svelte-1i3eer7");
    			add_location(input5, file$4, 26, 2, 928);
    			add_location(br8, file$4, 26, 102, 1028);
    			attr_dev(span2, "class", "weekday svelte-1i3eer7");
    			add_location(span2, file$4, 23, 0, 779);
    			add_location(br9, file$4, 29, 9, 1075);
    			attr_dev(input6, "type", "number");
    			input6.readOnly = /*readonly*/ ctx[1];
    			attr_dev(input6, "class", "svelte-1i3eer7");
    			add_location(input6, file$4, 30, 2, 1084);
    			add_location(br10, file$4, 30, 102, 1184);
    			attr_dev(input7, "type", "number");
    			input7.readOnly = /*readonly*/ ctx[1];
    			attr_dev(input7, "class", "svelte-1i3eer7");
    			add_location(input7, file$4, 31, 2, 1193);
    			add_location(br11, file$4, 31, 102, 1293);
    			attr_dev(span3, "class", "weekday svelte-1i3eer7");
    			add_location(span3, file$4, 28, 0, 1043);
    			add_location(br12, file$4, 34, 8, 1339);
    			attr_dev(input8, "type", "number");
    			input8.readOnly = /*readonly*/ ctx[1];
    			attr_dev(input8, "class", "svelte-1i3eer7");
    			add_location(input8, file$4, 35, 2, 1348);
    			add_location(br13, file$4, 35, 102, 1448);
    			attr_dev(input9, "type", "number");
    			input9.readOnly = /*readonly*/ ctx[1];
    			attr_dev(input9, "class", "svelte-1i3eer7");
    			add_location(input9, file$4, 36, 2, 1457);
    			add_location(br14, file$4, 36, 102, 1557);
    			attr_dev(span4, "class", "weekday svelte-1i3eer7");
    			add_location(span4, file$4, 33, 0, 1308);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			append_dev(span0, br0);
    			append_dev(span0, t1);
    			append_dev(span0, input0);
    			set_input_value(input0, /*week*/ ctx[0].mon.am.hours);
    			append_dev(span0, br1);
    			append_dev(span0, t2);
    			append_dev(span0, input1);
    			set_input_value(input1, /*week*/ ctx[0].mon.pm.hours);
    			append_dev(span0, br2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t4);
    			append_dev(span1, br3);
    			append_dev(span1, t5);
    			append_dev(span1, input2);
    			set_input_value(input2, /*week*/ ctx[0].tue.am.hours);
    			append_dev(span1, br4);
    			append_dev(span1, t6);
    			append_dev(span1, input3);
    			set_input_value(input3, /*week*/ ctx[0].tue.pm.hours);
    			append_dev(span1, br5);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t8);
    			append_dev(span2, br6);
    			append_dev(span2, t9);
    			append_dev(span2, input4);
    			set_input_value(input4, /*week*/ ctx[0].wed.am.hours);
    			append_dev(span2, br7);
    			append_dev(span2, t10);
    			append_dev(span2, input5);
    			set_input_value(input5, /*week*/ ctx[0].wed.pm.hours);
    			append_dev(span2, br8);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, span3, anchor);
    			append_dev(span3, t12);
    			append_dev(span3, br9);
    			append_dev(span3, t13);
    			append_dev(span3, input6);
    			set_input_value(input6, /*week*/ ctx[0].thu.am.hours);
    			append_dev(span3, br10);
    			append_dev(span3, t14);
    			append_dev(span3, input7);
    			set_input_value(input7, /*week*/ ctx[0].thu.pm.hours);
    			append_dev(span3, br11);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, span4, anchor);
    			append_dev(span4, t16);
    			append_dev(span4, br12);
    			append_dev(span4, t17);
    			append_dev(span4, input8);
    			set_input_value(input8, /*week*/ ctx[0].fri.am.hours);
    			append_dev(span4, br13);
    			append_dev(span4, t18);
    			append_dev(span4, input9);
    			set_input_value(input9, /*week*/ ctx[0].fri.pm.hours);
    			append_dev(span4, br14);

    			dispose = [
    				listen_dev(input0, "input", input0_input_handler),
    				listen_dev(input0, "change", /*validateHours*/ ctx[2], false, false, false),
    				listen_dev(input1, "input", input1_input_handler),
    				listen_dev(input1, "change", /*validateHours*/ ctx[2], false, false, false),
    				listen_dev(input2, "input", input2_input_handler),
    				listen_dev(input2, "change", /*validateHours*/ ctx[2], false, false, false),
    				listen_dev(input3, "input", input3_input_handler),
    				listen_dev(input3, "change", /*validateHours*/ ctx[2], false, false, false),
    				listen_dev(input4, "input", input4_input_handler),
    				listen_dev(input4, "change", /*validateHours*/ ctx[2], false, false, false),
    				listen_dev(input5, "input", input5_input_handler),
    				listen_dev(input5, "change", /*validateHours*/ ctx[2], false, false, false),
    				listen_dev(input6, "input", input6_input_handler),
    				listen_dev(input6, "change", /*validateHours*/ ctx[2], false, false, false),
    				listen_dev(input7, "input", input7_input_handler),
    				listen_dev(input7, "change", /*validateHours*/ ctx[2], false, false, false),
    				listen_dev(input8, "input", input8_input_handler),
    				listen_dev(input8, "change", /*validateHours*/ ctx[2], false, false, false),
    				listen_dev(input9, "input", input9_input_handler),
    				listen_dev(input9, "change", /*validateHours*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*readonly*/ 2) {
    				prop_dev(input0, "readOnly", /*readonly*/ ctx[1]);
    			}

    			if (!input0_updating && dirty & /*week*/ 1) {
    				set_input_value(input0, /*week*/ ctx[0].mon.am.hours);
    			}

    			input0_updating = false;

    			if (dirty & /*readonly*/ 2) {
    				prop_dev(input1, "readOnly", /*readonly*/ ctx[1]);
    			}

    			if (!input1_updating && dirty & /*week*/ 1) {
    				set_input_value(input1, /*week*/ ctx[0].mon.pm.hours);
    			}

    			input1_updating = false;

    			if (dirty & /*readonly*/ 2) {
    				prop_dev(input2, "readOnly", /*readonly*/ ctx[1]);
    			}

    			if (!input2_updating && dirty & /*week*/ 1) {
    				set_input_value(input2, /*week*/ ctx[0].tue.am.hours);
    			}

    			input2_updating = false;

    			if (dirty & /*readonly*/ 2) {
    				prop_dev(input3, "readOnly", /*readonly*/ ctx[1]);
    			}

    			if (!input3_updating && dirty & /*week*/ 1) {
    				set_input_value(input3, /*week*/ ctx[0].tue.pm.hours);
    			}

    			input3_updating = false;

    			if (dirty & /*readonly*/ 2) {
    				prop_dev(input4, "readOnly", /*readonly*/ ctx[1]);
    			}

    			if (!input4_updating && dirty & /*week*/ 1) {
    				set_input_value(input4, /*week*/ ctx[0].wed.am.hours);
    			}

    			input4_updating = false;

    			if (dirty & /*readonly*/ 2) {
    				prop_dev(input5, "readOnly", /*readonly*/ ctx[1]);
    			}

    			if (!input5_updating && dirty & /*week*/ 1) {
    				set_input_value(input5, /*week*/ ctx[0].wed.pm.hours);
    			}

    			input5_updating = false;

    			if (dirty & /*readonly*/ 2) {
    				prop_dev(input6, "readOnly", /*readonly*/ ctx[1]);
    			}

    			if (!input6_updating && dirty & /*week*/ 1) {
    				set_input_value(input6, /*week*/ ctx[0].thu.am.hours);
    			}

    			input6_updating = false;

    			if (dirty & /*readonly*/ 2) {
    				prop_dev(input7, "readOnly", /*readonly*/ ctx[1]);
    			}

    			if (!input7_updating && dirty & /*week*/ 1) {
    				set_input_value(input7, /*week*/ ctx[0].thu.pm.hours);
    			}

    			input7_updating = false;

    			if (dirty & /*readonly*/ 2) {
    				prop_dev(input8, "readOnly", /*readonly*/ ctx[1]);
    			}

    			if (!input8_updating && dirty & /*week*/ 1) {
    				set_input_value(input8, /*week*/ ctx[0].fri.am.hours);
    			}

    			input8_updating = false;

    			if (dirty & /*readonly*/ 2) {
    				prop_dev(input9, "readOnly", /*readonly*/ ctx[1]);
    			}

    			if (!input9_updating && dirty & /*week*/ 1) {
    				set_input_value(input9, /*week*/ ctx[0].fri.pm.hours);
    			}

    			input9_updating = false;
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(span4);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { week } = $$props;
    	let { readonly } = $$props;
    	const dispatch = createEventDispatcher();

    	const validateHours = e => {
    		// TODO: Validate input.
    		dispatch("estimateUpdated", {});
    	};

    	const writable_props = ["week", "readonly"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Week> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Week", $$slots, []);

    	function input0_input_handler() {
    		week.mon.am.hours = to_number(this.value);
    		$$invalidate(0, week);
    	}

    	function input1_input_handler() {
    		week.mon.pm.hours = to_number(this.value);
    		$$invalidate(0, week);
    	}

    	function input2_input_handler() {
    		week.tue.am.hours = to_number(this.value);
    		$$invalidate(0, week);
    	}

    	function input3_input_handler() {
    		week.tue.pm.hours = to_number(this.value);
    		$$invalidate(0, week);
    	}

    	function input4_input_handler() {
    		week.wed.am.hours = to_number(this.value);
    		$$invalidate(0, week);
    	}

    	function input5_input_handler() {
    		week.wed.pm.hours = to_number(this.value);
    		$$invalidate(0, week);
    	}

    	function input6_input_handler() {
    		week.thu.am.hours = to_number(this.value);
    		$$invalidate(0, week);
    	}

    	function input7_input_handler() {
    		week.thu.pm.hours = to_number(this.value);
    		$$invalidate(0, week);
    	}

    	function input8_input_handler() {
    		week.fri.am.hours = to_number(this.value);
    		$$invalidate(0, week);
    	}

    	function input9_input_handler() {
    		week.fri.pm.hours = to_number(this.value);
    		$$invalidate(0, week);
    	}

    	$$self.$set = $$props => {
    		if ("week" in $$props) $$invalidate(0, week = $$props.week);
    		if ("readonly" in $$props) $$invalidate(1, readonly = $$props.readonly);
    	};

    	$$self.$capture_state = () => ({
    		week,
    		readonly,
    		createEventDispatcher,
    		dispatch,
    		validateHours
    	});

    	$$self.$inject_state = $$props => {
    		if ("week" in $$props) $$invalidate(0, week = $$props.week);
    		if ("readonly" in $$props) $$invalidate(1, readonly = $$props.readonly);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		week,
    		readonly,
    		validateHours,
    		dispatch,
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

    class Week extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { week: 0, readonly: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Week",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*week*/ ctx[0] === undefined && !("week" in props)) {
    			console.warn("<Week> was created without expected prop 'week'");
    		}

    		if (/*readonly*/ ctx[1] === undefined && !("readonly" in props)) {
    			console.warn("<Week> was created without expected prop 'readonly'");
    		}
    	}

    	get week() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set week(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const Roles = {
      Backend: {
        description: 'En utvecklare som bygger allt som ligger under huven. Behövs i alla projekt där man vill att saker händer bortom användargränssnitten.',
        rate: 1000,
      },
      'Data Scientist': {
        description: 'En person med bakgrund inom matematik (framförallt statistik) och AI/ML. Hjälper teamet att hitta samband, tolka data och ställa rätt typ av frågor.',
        rate: 1200,
      },
      DevOps: {
        description: 'En utvecklare som lägger fokus på driftmiljöer, säkerhet, stabilitet och alla tekniska verktyg som teamet behöver för att kunna leverera värde.',
        rate: 1200,
      },
      Frontend: {
        description: 'En utvecklare som bygger appar, webb och annat som ligger nära användarna.',
        rate: 1000,
      },
      TeamCoach: {
        description: 'TeamCoach håller koll på de bredare perspektiven och ser till att teamet fungerar bra och att alla individer har det de behöver för att kunna leverera.',
        rate: 1500,
      },
      UX: {
        description: 'En person som arbetar med slutanvändarna i fokus. Arbetar med allt från att studera användares behov och beteenden till att hålla workshops samt ta fram look-and-feel för slutprodukter.',
        rate: 1200,
      },
    };

    /* src/App.svelte generated by Svelte v3.19.2 */

    const { Object: Object_1$1 } = globals;
    const file$5 = "src/App.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (137:1) {#each Object.keys(Roles) as role}
    function create_each_block$2(ctx) {
    	let h3;
    	let t0_value = /*role*/ ctx[7] + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = Roles[/*role*/ ctx[7]].description + "";
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			add_location(h3, file$5, 137, 2, 2279);
    			add_location(p, file$5, 138, 2, 2297);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(137:1) {#each Object.keys(Roles) as role}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h20;
    	let t3;
    	let hr0;
    	let t4;
    	let t5;
    	let h21;
    	let t7;
    	let hr1;
    	let t8;
    	let t9;
    	let h22;
    	let t11;
    	let hr2;
    	let t12;
    	let t13;
    	let t14;
    	let h23;
    	let t16;
    	let hr3;
    	let t17;
    	let current;
    	const team_1 = new Team({ props: { roles: Roles }, $$inline: true });
    	team_1.$on("addRole", /*addRole*/ ctx[3]);

    	const plan = new Plan({
    			props: { team: /*team*/ ctx[2] },
    			$$inline: true
    		});

    	plan.$on("estimateUpdated", /*summarize*/ ctx[4]);

    	const week_1 = new Week({
    			props: { week: /*week*/ ctx[0], readonly: true },
    			$$inline: true
    		});

    	week_1.$on("estimateUpdated", /*summarize*/ ctx[4]);

    	const summary_1 = new Summary({
    			props: { summary: /*summary*/ ctx[1] },
    			$$inline: true
    		});

    	let each_value = Object.keys(Roles);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Priskalkylator";
    			t1 = space();
    			h20 = element("h2");
    			h20.textContent = "Roller";
    			t3 = space();
    			hr0 = element("hr");
    			t4 = space();
    			create_component(team_1.$$.fragment);
    			t5 = space();
    			h21 = element("h2");
    			h21.textContent = "Tid";
    			t7 = space();
    			hr1 = element("hr");
    			t8 = space();
    			create_component(plan.$$.fragment);
    			t9 = space();
    			h22 = element("h2");
    			h22.textContent = "Summering";
    			t11 = space();
    			hr2 = element("hr");
    			t12 = space();
    			create_component(week_1.$$.fragment);
    			t13 = space();
    			create_component(summary_1.$$.fragment);
    			t14 = space();
    			h23 = element("h2");
    			h23.textContent = "Information";
    			t16 = space();
    			hr3 = element("hr");
    			t17 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$5, 119, 1, 1910);
    			add_location(h20, file$5, 121, 1, 1936);
    			add_location(hr0, file$5, 122, 1, 1953);
    			add_location(h21, file$5, 125, 1, 2007);
    			add_location(hr1, file$5, 126, 1, 2021);
    			add_location(h22, file$5, 129, 1, 2083);
    			add_location(hr2, file$5, 130, 1, 2103);
    			add_location(h23, file$5, 134, 1, 2212);
    			add_location(hr3, file$5, 135, 1, 2234);
    			attr_dev(main, "class", "svelte-1h6otfa");
    			add_location(main, file$5, 118, 0, 1902);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h20);
    			append_dev(main, t3);
    			append_dev(main, hr0);
    			append_dev(main, t4);
    			mount_component(team_1, main, null);
    			append_dev(main, t5);
    			append_dev(main, h21);
    			append_dev(main, t7);
    			append_dev(main, hr1);
    			append_dev(main, t8);
    			mount_component(plan, main, null);
    			append_dev(main, t9);
    			append_dev(main, h22);
    			append_dev(main, t11);
    			append_dev(main, hr2);
    			append_dev(main, t12);
    			mount_component(week_1, main, null);
    			append_dev(main, t13);
    			mount_component(summary_1, main, null);
    			append_dev(main, t14);
    			append_dev(main, h23);
    			append_dev(main, t16);
    			append_dev(main, hr3);
    			append_dev(main, t17);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const plan_changes = {};
    			if (dirty & /*team*/ 4) plan_changes.team = /*team*/ ctx[2];
    			plan.$set(plan_changes);
    			const week_1_changes = {};
    			if (dirty & /*week*/ 1) week_1_changes.week = /*week*/ ctx[0];
    			week_1.$set(week_1_changes);
    			const summary_1_changes = {};
    			if (dirty & /*summary*/ 2) summary_1_changes.summary = /*summary*/ ctx[1];
    			summary_1.$set(summary_1_changes);

    			if (dirty & /*Roles, Object*/ 0) {
    				each_value = Object.keys(Roles);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(team_1.$$.fragment, local);
    			transition_in(plan.$$.fragment, local);
    			transition_in(week_1.$$.fragment, local);
    			transition_in(summary_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(team_1.$$.fragment, local);
    			transition_out(plan.$$.fragment, local);
    			transition_out(week_1.$$.fragment, local);
    			transition_out(summary_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(team_1);
    			destroy_component(plan);
    			destroy_component(week_1);
    			destroy_component(summary_1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const estimate = {};

    	Object.keys(Roles).forEach(role => {
    		estimate[role] = 0;
    	});

    	const weekTemplate = {
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

    	let week = JSON.parse(JSON.stringify(weekTemplate));
    	const summary = { roles: 0, hours: 0, rate: 0 };
    	let team = [];

    	const addRole = ({ detail }) => {
    		team.push({
    			role: detail.role,
    			week: {
    				mon: { am: false, pm: false },
    				tue: { am: false, pm: false },
    				wed: { am: false, pm: false },
    				thu: { am: false, pm: false },
    				fri: { am: false, pm: false }
    			}
    		});

    		$$invalidate(2, team = team); // NOTE: Svelte does not trigger on array.push()
    	};

    	const summarize = () => {
    		$$invalidate(1, summary.roles = team.length, summary);

    		// Reset week.
    		$$invalidate(0, week = JSON.parse(JSON.stringify(weekTemplate)));

    		// Reset rate.
    		$$invalidate(1, summary.rate = 0, summary);

    		team.forEach(member => {
    			Object.keys(member.week).forEach(day => {
    				if (member.week[day].am) {
    					$$invalidate(0, week[day].am.hours += 4, week);
    					$$invalidate(1, summary.rate += Roles[member.role].rate * 4, summary);
    				}

    				if (member.week[day].pm) {
    					$$invalidate(0, week[day].pm.hours += 4, week);
    					$$invalidate(1, summary.rate += Roles[member.role].rate * 4, summary);
    				}
    			});
    		});

    		$$invalidate(
    			1,
    			summary.hours = Object.keys(week).reduce(
    				(a, day) => {
    					return a + week[day].am.hours + week[day].pm.hours;
    				},
    				0
    			),
    			summary
    		);
    	};

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Plan,
    		Summary,
    		Team,
    		Week,
    		Roles,
    		estimate,
    		weekTemplate,
    		week,
    		summary,
    		team,
    		addRole,
    		summarize
    	});

    	$$self.$inject_state = $$props => {
    		if ("week" in $$props) $$invalidate(0, week = $$props.week);
    		if ("team" in $$props) $$invalidate(2, team = $$props.team);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [week, summary, team, addRole, summarize];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
