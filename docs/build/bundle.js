
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

    /* src/Hero.svelte generated by Svelte v3.19.2 */

    const file = "src/Hero.svelte";

    function create_fragment(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "hero");
    			attr_dev(div, "class", "svelte-2ftw59");
    			add_location(div, file, 35, 0, 546);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Hero", $$slots, []);
    	return [];
    }

    class Hero extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/Shared/Bubble.svelte generated by Svelte v3.19.2 */

    const file$1 = "src/Shared/Bubble.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let span0;
    	let img;
    	let img_src_value;
    	let t0;
    	let span1;
    	let t1;
    	let t2;
    	let span2;
    	let t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			img = element("img");
    			t0 = space();
    			span1 = element("span");
    			t1 = text(/*main*/ ctx[1]);
    			t2 = space();
    			span2 = element("span");
    			t3 = text(/*sub*/ ctx[2]);
    			if (img.src !== (img_src_value = "/cuppSass.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*alt*/ ctx[0]);
    			attr_dev(img, "class", "svelte-ztkwei");
    			add_location(img, file$1, 7, 8, 101);
    			attr_dev(span0, "class", "svelte-ztkwei");
    			add_location(span0, file$1, 7, 2, 95);
    			attr_dev(span1, "class", "main svelte-ztkwei");
    			add_location(span1, file$1, 8, 2, 148);
    			attr_dev(span2, "class", "svelte-ztkwei");
    			add_location(span2, file$1, 9, 2, 183);
    			attr_dev(div, "class", "bubble svelte-ztkwei");
    			add_location(div, file$1, 6, 0, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, img);
    			append_dev(div, t0);
    			append_dev(div, span1);
    			append_dev(span1, t1);
    			append_dev(div, t2);
    			append_dev(div, span2);
    			append_dev(span2, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*alt*/ 1) {
    				attr_dev(img, "alt", /*alt*/ ctx[0]);
    			}

    			if (dirty & /*main*/ 2) set_data_dev(t1, /*main*/ ctx[1]);
    			if (dirty & /*sub*/ 4) set_data_dev(t3, /*sub*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { alt } = $$props;
    	let { main } = $$props;
    	let { sub } = $$props;
    	const writable_props = ["alt", "main", "sub"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bubble> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Bubble", $$slots, []);

    	$$self.$set = $$props => {
    		if ("alt" in $$props) $$invalidate(0, alt = $$props.alt);
    		if ("main" in $$props) $$invalidate(1, main = $$props.main);
    		if ("sub" in $$props) $$invalidate(2, sub = $$props.sub);
    	};

    	$$self.$capture_state = () => ({ alt, main, sub });

    	$$self.$inject_state = $$props => {
    		if ("alt" in $$props) $$invalidate(0, alt = $$props.alt);
    		if ("main" in $$props) $$invalidate(1, main = $$props.main);
    		if ("sub" in $$props) $$invalidate(2, sub = $$props.sub);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [alt, main, sub];
    }

    class Bubble extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { alt: 0, main: 1, sub: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bubble",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*alt*/ ctx[0] === undefined && !("alt" in props)) {
    			console.warn("<Bubble> was created without expected prop 'alt'");
    		}

    		if (/*main*/ ctx[1] === undefined && !("main" in props)) {
    			console.warn("<Bubble> was created without expected prop 'main'");
    		}

    		if (/*sub*/ ctx[2] === undefined && !("sub" in props)) {
    			console.warn("<Bubble> was created without expected prop 'sub'");
    		}
    	}

    	get alt() {
    		throw new Error("<Bubble>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set alt(value) {
    		throw new Error("<Bubble>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get main() {
    		throw new Error("<Bubble>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set main(value) {
    		throw new Error("<Bubble>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sub() {
    		throw new Error("<Bubble>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sub(value) {
    		throw new Error("<Bubble>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const Roles = {
      Backend: {
        description: 'Vi ser till att produkten är användbar.',
        rate: 1000,
      },
      'Data Scientist': {
        description: 'Vi kan AI.',
        rate: 1200,
      },
      DevOps: {
        description: 'Vi ser till att alla tekniska delar sitter ihop.',
        rate: 1200,
      },
      Frontend: {
        description: 'Det är vi som bygger appar.',
        rate: 1000,
      },
      TeamCoach: {
        description: 'Vi säkerställer leveransen och ser till att alla i teamet mår bra.',
        rate: 1500,
      },
      'UX-Designer': {
        description: 'Vi ser till att produkten är användbar av människor.',
        rate: 1200,
      },
    };

    /* src/Wizard/Team.svelte generated by Svelte v3.19.2 */

    const { Object: Object_1 } = globals;
    const file$2 = "src/Wizard/Team.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (79:2) {#each Object.keys(Roles) as role, index}
    function create_each_block(ctx) {
    	let div;
    	let span0;
    	let input;
    	let input_updating = false;
    	let t0;
    	let span2;
    	let h2;
    	let t1_value = /*role*/ ctx[4] + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = Roles[/*role*/ ctx[4]].description + "";
    	let t3;
    	let dispose;

    	function input_input_handler() {
    		input_updating = true;
    		/*input_input_handler*/ ctx[3].call(input, /*role*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			input = element("input");
    			t0 = space();
    			span2 = element("span");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "class", "svelte-1vrl3in");
    			add_location(input, file$2, 80, 26, 1481);
    			attr_dev(span0, "class", "count svelte-1vrl3in");
    			add_location(span0, file$2, 80, 6, 1461);
    			add_location(h2, file$2, 82, 8, 1582);
    			add_location(span1, file$2, 83, 8, 1606);
    			attr_dev(span2, "class", "team svelte-1vrl3in");
    			add_location(span2, file$2, 81, 6, 1554);
    			attr_dev(div, "class", "role svelte-1vrl3in");
    			add_location(div, file$2, 79, 4, 1436);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, input);
    			set_input_value(input, /*state*/ ctx[0].team.roles[/*role*/ ctx[4]]);
    			append_dev(div, t0);
    			append_dev(div, span2);
    			append_dev(span2, h2);
    			append_dev(h2, t1);
    			append_dev(span2, t2);
    			append_dev(span2, span1);
    			append_dev(span1, t3);
    			dispose = listen_dev(input, "input", input_input_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!input_updating && dirty & /*state, Object, Roles*/ 1) {
    				set_input_value(input, /*state*/ ctx[0].team.roles[/*role*/ ctx[4]]);
    			}

    			input_updating = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(79:2) {#each Object.keys(Roles) as role, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let h1;
    	let t3;
    	let t4;
    	let div1;
    	let span0;
    	let t5;
    	let span1;
    	let button;
    	let current;
    	let dispose;

    	const bubble0 = new Bubble({
    			props: { alt: "", main: "0 kr", sub: "per månad" },
    			$$inline: true
    		});

    	const bubble1 = new Bubble({
    			props: { alt: "", main: "1337", sub: "Teamtaxa" },
    			$$inline: true
    		});

    	let each_value = Object.keys(Roles);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(bubble0.$$.fragment);
    			t0 = space();
    			create_component(bubble1.$$.fragment);
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Hur ser ditt drömteam ut?";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div1 = element("div");
    			span0 = element("span");
    			t5 = space();
    			span1 = element("span");
    			button = element("button");
    			button.textContent = "Hur länge? >";
    			attr_dev(div0, "class", "bubbles svelte-1vrl3in");
    			add_location(div0, file$2, 71, 2, 1207);
    			add_location(h1, file$2, 76, 2, 1352);
    			add_location(span0, file$2, 89, 4, 1712);
    			attr_dev(button, "class", "svelte-1vrl3in");
    			add_location(button, file$2, 90, 10, 1736);
    			add_location(span1, file$2, 90, 4, 1730);
    			attr_dev(div1, "class", "navigation svelte-1vrl3in");
    			add_location(div1, file$2, 88, 2, 1683);
    			add_location(div2, file$2, 70, 0, 1199);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(bubble0, div0, null);
    			append_dev(div0, t0);
    			mount_component(bubble1, div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, h1);
    			append_dev(div2, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t5);
    			append_dev(div1, span1);
    			append_dev(span1, button);
    			current = true;
    			dispose = listen_dev(button, "click", /*next*/ ctx[1], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Roles, Object, state*/ 1) {
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
    						each_blocks[i].m(div2, t4);
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
    			transition_in(bubble0.$$.fragment, local);
    			transition_in(bubble1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bubble0.$$.fragment, local);
    			transition_out(bubble1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(bubble0);
    			destroy_component(bubble1);
    			destroy_each(each_blocks, detaching);
    			dispose();
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
    	let { state } = $$props;
    	const dispatch = createEventDispatcher();

    	const next = () => {
    		dispatch("step", { step: "Week" });
    	};

    	const writable_props = ["state"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Team> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Team", $$slots, []);

    	function input_input_handler(role) {
    		state.team.roles[role] = to_number(this.value);
    		$$invalidate(0, state);
    	}

    	$$self.$set = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		state,
    		Bubble,
    		Roles,
    		createEventDispatcher,
    		dispatch,
    		next
    	});

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [state, next, dispatch, input_input_handler];
    }

    class Team extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { state: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Team",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*state*/ ctx[0] === undefined && !("state" in props)) {
    			console.warn("<Team> was created without expected prop 'state'");
    		}
    	}

    	get state() {
    		throw new Error("<Team>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Team>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Wizard/Week.svelte generated by Svelte v3.19.2 */

    const { Object: Object_1$1 } = globals;
    const file$3 = "src/Wizard/Week.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (84:2) {#each Object.keys(state.week) as day, index}
    function create_each_block$1(ctx) {
    	let div;
    	let span0;
    	let input;
    	let input_updating = false;
    	let t0;
    	let span1;
    	let h2;
    	let t1_value = /*day*/ ctx[5] + "";
    	let t1;
    	let dispose;

    	function input_input_handler() {
    		input_updating = true;
    		/*input_input_handler*/ ctx[4].call(input, /*day*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			input = element("input");
    			t0 = space();
    			span1 = element("span");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "class", "svelte-1vrl3in");
    			add_location(input, file$3, 85, 26, 1511);
    			attr_dev(span0, "class", "count svelte-1vrl3in");
    			add_location(span0, file$3, 85, 6, 1491);
    			add_location(h2, file$3, 87, 8, 1605);
    			attr_dev(span1, "class", "team svelte-1vrl3in");
    			add_location(span1, file$3, 86, 6, 1577);
    			attr_dev(div, "class", "role svelte-1vrl3in");
    			add_location(div, file$3, 84, 4, 1466);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, input);
    			set_input_value(input, /*state*/ ctx[0].week[/*day*/ ctx[5]]);
    			append_dev(div, t0);
    			append_dev(div, span1);
    			append_dev(span1, h2);
    			append_dev(h2, t1);
    			dispose = listen_dev(input, "input", input_input_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!input_updating && dirty & /*state, Object*/ 1) {
    				set_input_value(input, /*state*/ ctx[0].week[/*day*/ ctx[5]]);
    			}

    			input_updating = false;
    			if (dirty & /*state*/ 1 && t1_value !== (t1_value = /*day*/ ctx[5] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(84:2) {#each Object.keys(state.week) as day, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let h1;
    	let t3;
    	let t4;
    	let div1;
    	let span0;
    	let button0;
    	let t6;
    	let span1;
    	let button1;
    	let current;
    	let dispose;

    	const bubble0 = new Bubble({
    			props: { alt: "", main: "1337", sub: "Teamtaxa" },
    			$$inline: true
    		});

    	const bubble1 = new Bubble({
    			props: { alt: "", main: "1 dag", sub: "i veckan" },
    			$$inline: true
    		});

    	let each_value = Object.keys(/*state*/ ctx[0].week);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(bubble0.$$.fragment);
    			t0 = space();
    			create_component(bubble1.$$.fragment);
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "När ska vi jobba ihop?";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div1 = element("div");
    			span0 = element("span");
    			button0 = element("button");
    			button0.textContent = "< Vad behöver du?";
    			t6 = space();
    			span1 = element("span");
    			button1 = element("button");
    			button1.textContent = "Hur länge? >";
    			attr_dev(div0, "class", "bubbles svelte-1vrl3in");
    			add_location(div0, file$3, 76, 2, 1236);
    			add_location(h1, file$3, 81, 2, 1381);
    			attr_dev(button0, "class", "svelte-1vrl3in");
    			add_location(button0, file$3, 93, 10, 1693);
    			add_location(span0, file$3, 93, 4, 1687);
    			attr_dev(button1, "class", "svelte-1vrl3in");
    			add_location(button1, file$3, 94, 10, 1764);
    			add_location(span1, file$3, 94, 4, 1758);
    			attr_dev(div1, "class", "navigation svelte-1vrl3in");
    			add_location(div1, file$3, 92, 2, 1658);
    			add_location(div2, file$3, 75, 0, 1228);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(bubble0, div0, null);
    			append_dev(div0, t0);
    			mount_component(bubble1, div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, h1);
    			append_dev(div2, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(span0, button0);
    			append_dev(div1, t6);
    			append_dev(div1, span1);
    			append_dev(span1, button1);
    			current = true;

    			dispose = [
    				listen_dev(button0, "click", /*prev*/ ctx[2], false, false, false),
    				listen_dev(button1, "click", /*next*/ ctx[1], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, state*/ 1) {
    				each_value = Object.keys(/*state*/ ctx[0].week);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, t4);
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
    			transition_in(bubble0.$$.fragment, local);
    			transition_in(bubble1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bubble0.$$.fragment, local);
    			transition_out(bubble1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(bubble0);
    			destroy_component(bubble1);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
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
    	let { state } = $$props;
    	const dispatch = createEventDispatcher();

    	const next = () => {
    		dispatch("step", { step: "Start" });
    	};

    	const prev = () => {
    		dispatch("step", { step: "Team" });
    	};

    	const writable_props = ["state"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Week> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Week", $$slots, []);

    	function input_input_handler(day) {
    		state.week[day] = to_number(this.value);
    		$$invalidate(0, state);
    	}

    	$$self.$set = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		state,
    		Bubble,
    		createEventDispatcher,
    		dispatch,
    		next,
    		prev
    	});

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [state, next, prev, dispatch, input_input_handler];
    }

    class Week extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { state: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Week",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*state*/ ctx[0] === undefined && !("state" in props)) {
    			console.warn("<Week> was created without expected prop 'state'");
    		}
    	}

    	get state() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.19.2 */
    const file$4 = "src/App.svelte";

    // (34:2) {#if step === 'Team'}
    function create_if_block_1(ctx) {
    	let current;

    	const team = new Team({
    			props: { state: /*state*/ ctx[1] },
    			$$inline: true
    		});

    	team.$on("step", /*selectWizardStepEventHandler*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(team.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(team, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(team.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(team.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(team, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(34:2) {#if step === 'Team'}",
    		ctx
    	});

    	return block;
    }

    // (38:2) {#if step === 'Week'}
    function create_if_block(ctx) {
    	let current;

    	const week = new Week({
    			props: { state: /*state*/ ctx[1] },
    			$$inline: true
    		});

    	week.$on("step", /*selectWizardStepEventHandler*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(week.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(week, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(week.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(week.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(week, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(38:2) {#if step === 'Week'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let current;
    	const hero = new Hero({ $$inline: true });
    	let if_block0 = /*step*/ ctx[0] === "Team" && create_if_block_1(ctx);
    	let if_block1 = /*step*/ ctx[0] === "Week" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(hero.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "svelte-7zkk5b");
    			add_location(main, file$4, 30, 0, 539);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(hero, main, null);
    			append_dev(main, t0);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t1);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*step*/ ctx[0] === "Team") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*step*/ ctx[0] === "Week") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hero.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hero.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(hero);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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
    	const state = {
    		summary: { hourly: 0, monthly: 0 },
    		team: { roles: {} },
    		week: {
    			monday: 0,
    			tuesday: 0,
    			wednesday: 0,
    			thursday: 0,
    			friday: 0
    		}
    	};

    	// Wizard steps.
    	let step = "Team";

    	const selectWizardStepEventHandler = ({ detail }) => {
    		$$invalidate(0, step = detail.step);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Hero,
    		Team,
    		Week,
    		state,
    		step,
    		selectWizardStepEventHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("step" in $$props) $$invalidate(0, step = $$props.step);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [step, state, selectWizardStepEventHandler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
