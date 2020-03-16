
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
    function null_to_empty(value) {
        return value == null ? '' : value;
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
    function children(element) {
        return Array.from(element.childNodes);
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
    			attr_dev(div, "class", "svelte-m5dntq");
    			add_location(div, file, 17, 0, 242);
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
    			add_location(img, file$1, 7, 8, 101);
    			attr_dev(span0, "class", "svelte-1nbrszk");
    			add_location(span0, file$1, 7, 2, 95);
    			attr_dev(span1, "class", "main svelte-1nbrszk");
    			add_location(span1, file$1, 8, 2, 148);
    			attr_dev(span2, "class", "svelte-1nbrszk");
    			add_location(span2, file$1, 9, 2, 183);
    			attr_dev(div, "class", "bubble svelte-1nbrszk");
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

    /* src/Wizard/Team.svelte generated by Svelte v3.19.2 */
    const file$2 = "src/Wizard/Team.svelte";

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let h1;
    	let current;

    	const bubble0 = new Bubble({
    			props: { alt: "", main: "0 kr", sub: "per månad" },
    			$$inline: true
    		});

    	const bubble1 = new Bubble({
    			props: { alt: "", main: "1337", sub: "Teamtaxa" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(bubble0.$$.fragment);
    			t0 = space();
    			create_component(bubble1.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Välj ditt drömteam";
    			attr_dev(div0, "class", "bubbles svelte-91txfb");
    			add_location(div0, file$2, 16, 2, 269);
    			add_location(h1, file$2, 22, 4, 424);
    			add_location(div1, file$2, 21, 2, 414);
    			add_location(div2, file$2, 15, 0, 261);
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
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			current = true;
    		},
    		p: noop,
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Team> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Team", $$slots, []);
    	$$self.$capture_state = () => ({ Bubble });
    	return [];
    }

    class Team extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Team",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/WeekBlocks.svelte generated by Svelte v3.19.2 */
    const file$3 = "src/WeekBlocks.svelte";

    function create_fragment$3(ctx) {
    	let span0;
    	let t0;
    	let br0;
    	let t1;
    	let input0;
    	let t2;
    	let br1;
    	let t3;
    	let input1;
    	let br2;
    	let t4;
    	let span1;
    	let t5;
    	let br3;
    	let t6;
    	let input2;
    	let br4;
    	let t7;
    	let input3;
    	let br5;
    	let t8;
    	let span2;
    	let t9;
    	let br6;
    	let t10;
    	let input4;
    	let br7;
    	let t11;
    	let input5;
    	let br8;
    	let t12;
    	let span3;
    	let t13;
    	let br9;
    	let t14;
    	let input6;
    	let br10;
    	let t15;
    	let input7;
    	let br11;
    	let t16;
    	let span4;
    	let t17;
    	let br12;
    	let t18;
    	let input8;
    	let br13;
    	let t19;
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
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			input1 = element("input");
    			br2 = element("br");
    			t4 = space();
    			span1 = element("span");
    			t5 = text("Tisdag");
    			br3 = element("br");
    			t6 = space();
    			input2 = element("input");
    			br4 = element("br");
    			t7 = space();
    			input3 = element("input");
    			br5 = element("br");
    			t8 = space();
    			span2 = element("span");
    			t9 = text("Onsdag");
    			br6 = element("br");
    			t10 = space();
    			input4 = element("input");
    			br7 = element("br");
    			t11 = space();
    			input5 = element("input");
    			br8 = element("br");
    			t12 = space();
    			span3 = element("span");
    			t13 = text("Torsdag");
    			br9 = element("br");
    			t14 = space();
    			input6 = element("input");
    			br10 = element("br");
    			t15 = space();
    			input7 = element("input");
    			br11 = element("br");
    			t16 = space();
    			span4 = element("span");
    			t17 = text("Fredag");
    			br12 = element("br");
    			t18 = space();
    			input8 = element("input");
    			br13 = element("br");
    			t19 = space();
    			input9 = element("input");
    			br14 = element("br");
    			add_location(br0, file$3, 12, 8, 225);
    			attr_dev(input0, "type", "checkbox");
    			attr_dev(input0, "class", "svelte-10t778w");
    			add_location(input0, file$3, 13, 2, 234);
    			add_location(br1, file$3, 14, 2, 308);
    			attr_dev(input1, "type", "checkbox");
    			attr_dev(input1, "class", "svelte-10t778w");
    			add_location(input1, file$3, 15, 2, 317);
    			add_location(br2, file$3, 15, 73, 388);
    			attr_dev(span0, "class", "weekday svelte-10t778w");
    			add_location(span0, file$3, 11, 0, 194);
    			add_location(br3, file$3, 18, 8, 434);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "class", "svelte-10t778w");
    			add_location(input2, file$3, 19, 2, 443);
    			add_location(br4, file$3, 19, 73, 514);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "class", "svelte-10t778w");
    			add_location(input3, file$3, 20, 2, 523);
    			add_location(br5, file$3, 20, 73, 594);
    			attr_dev(span1, "class", "weekday svelte-10t778w");
    			add_location(span1, file$3, 17, 0, 403);
    			add_location(br6, file$3, 23, 8, 640);
    			attr_dev(input4, "type", "checkbox");
    			attr_dev(input4, "class", "svelte-10t778w");
    			add_location(input4, file$3, 24, 2, 649);
    			add_location(br7, file$3, 24, 73, 720);
    			attr_dev(input5, "type", "checkbox");
    			attr_dev(input5, "class", "svelte-10t778w");
    			add_location(input5, file$3, 25, 2, 729);
    			add_location(br8, file$3, 25, 73, 800);
    			attr_dev(span2, "class", "weekday svelte-10t778w");
    			add_location(span2, file$3, 22, 0, 609);
    			add_location(br9, file$3, 28, 9, 847);
    			attr_dev(input6, "type", "checkbox");
    			attr_dev(input6, "class", "svelte-10t778w");
    			add_location(input6, file$3, 29, 2, 856);
    			add_location(br10, file$3, 29, 73, 927);
    			attr_dev(input7, "type", "checkbox");
    			attr_dev(input7, "class", "svelte-10t778w");
    			add_location(input7, file$3, 30, 2, 936);
    			add_location(br11, file$3, 30, 73, 1007);
    			attr_dev(span3, "class", "weekday svelte-10t778w");
    			add_location(span3, file$3, 27, 0, 815);
    			add_location(br12, file$3, 33, 8, 1053);
    			attr_dev(input8, "type", "checkbox");
    			attr_dev(input8, "class", "svelte-10t778w");
    			add_location(input8, file$3, 34, 2, 1062);
    			add_location(br13, file$3, 34, 73, 1133);
    			attr_dev(input9, "type", "checkbox");
    			attr_dev(input9, "class", "svelte-10t778w");
    			add_location(input9, file$3, 35, 2, 1142);
    			add_location(br14, file$3, 35, 73, 1213);
    			attr_dev(span4, "class", "weekday svelte-10t778w");
    			add_location(span4, file$3, 32, 0, 1022);
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
    			append_dev(span0, t2);
    			append_dev(span0, br1);
    			append_dev(span0, t3);
    			append_dev(span0, input1);
    			input1.checked = /*week*/ ctx[0].mon.pm;
    			append_dev(span0, br2);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t5);
    			append_dev(span1, br3);
    			append_dev(span1, t6);
    			append_dev(span1, input2);
    			input2.checked = /*week*/ ctx[0].tue.am;
    			append_dev(span1, br4);
    			append_dev(span1, t7);
    			append_dev(span1, input3);
    			input3.checked = /*week*/ ctx[0].tue.pm;
    			append_dev(span1, br5);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t9);
    			append_dev(span2, br6);
    			append_dev(span2, t10);
    			append_dev(span2, input4);
    			input4.checked = /*week*/ ctx[0].wed.am;
    			append_dev(span2, br7);
    			append_dev(span2, t11);
    			append_dev(span2, input5);
    			input5.checked = /*week*/ ctx[0].wed.pm;
    			append_dev(span2, br8);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, span3, anchor);
    			append_dev(span3, t13);
    			append_dev(span3, br9);
    			append_dev(span3, t14);
    			append_dev(span3, input6);
    			input6.checked = /*week*/ ctx[0].thu.am;
    			append_dev(span3, br10);
    			append_dev(span3, t15);
    			append_dev(span3, input7);
    			input7.checked = /*week*/ ctx[0].thu.pm;
    			append_dev(span3, br11);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, span4, anchor);
    			append_dev(span4, t17);
    			append_dev(span4, br12);
    			append_dev(span4, t18);
    			append_dev(span4, input8);
    			input8.checked = /*week*/ ctx[0].fri.am;
    			append_dev(span4, br13);
    			append_dev(span4, t19);
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
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(span4);
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
    	let { week } = $$props;
    	const dispatch = createEventDispatcher();

    	const change = e => {
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { week: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WeekBlocks",
    			options,
    			id: create_fragment$3.name
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

    const Templates = {
      Days: [
        {
          name: 'En dag',
          days: 1,
          full: ['Backend', 'Frontend', 'UX'],
        },
        {
          name: 'Två dagar',
          days: 2,
          full: ['Backend', 'Frontend', 'UX'],
        },
        {
          name: 'Tre dagar',
          days: 3,
          full: ['Backend', 'Frontend', 'UX'],
        },
        {
          name: 'Fyra dagar',
          days: 4,
          full: ['Backend', 'Frontend', 'UX'],
        },
      ],
      Teams: {
    		API: [
    			'Backend',
    			'Backend',
    			'Backend',
    			'DevOps',
    			'TeamCoach',
    		],
    		APP: [
    			'Backend',
    			'Frontend',
    			'DevOps',
    			'TeamCoach',
    			'UX',
    		],
    		Labb: [
    			'Backend',
    			'Backend',
    			'Frontend',
    			'DevOps',
    			'TeamCoach',
    			'UX',
    			'UX',
    		]
    	},
    };

    /* src/Plan.svelte generated by Svelte v3.19.2 */

    const { Object: Object_1 } = globals;
    const file$4 = "src/Plan.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (52:0) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Lägg till roller i ditt team för att börja titta på hur veckorna kan se ut.";
    			add_location(p, file$4, 52, 2, 1253);
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
    		source: "(52:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (38:0) {#if team.length}
    function create_if_block(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let each1_anchor;
    	let current;
    	let each_value_1 = Templates.Days;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

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
    			p0 = element("p");
    			p0.textContent = "Fyll veckan med en föreslagen plan";
    			t1 = space();
    			p1 = element("p");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each1_anchor = empty();
    			add_location(p0, file$4, 38, 2, 907);
    			add_location(p1, file$4, 41, 2, 959);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(p1, null);
    			}

    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prePlan, Templates*/ 4) {
    				each_value_1 = Templates.Days;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(p1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

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
    						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
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
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(38:0) {#if team.length}",
    		ctx
    	});

    	return block;
    }

    // (43:4) {#each Templates.Days as template}
    function create_each_block_1(ctx) {
    	let button;
    	let t_value = /*template*/ ctx[8].name + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*template*/ ctx[8], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-1b3xcc3");
    			add_location(button, file$4, 43, 6, 1008);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    			dispose = listen_dev(button, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(43:4) {#each Templates.Days as template}",
    		ctx
    	});

    	return block;
    }

    // (47:2) {#each team as member}
    function create_each_block(ctx) {
    	let h3;
    	let t0_value = /*member*/ ctx[5].role + "";
    	let t0;
    	let t1;
    	let t2;
    	let br;
    	let current;

    	const weekblocks = new WeekBlocks({
    			props: { week: /*member*/ ctx[5].week },
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
    			add_location(h3, file$4, 47, 4, 1124);
    			add_location(br, file$4, 49, 4, 1226);
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
    			if ((!current || dirty & /*team*/ 1) && t0_value !== (t0_value = /*member*/ ctx[5].role + "")) set_data_dev(t0, t0_value);
    			const weekblocks_changes = {};
    			if (dirty & /*team*/ 1) weekblocks_changes.week = /*member*/ ctx[5].week;
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
    		source: "(47:2) {#each team as member}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const selected = 0;

    function instance$4($$self, $$props, $$invalidate) {
    	let { team } = $$props;
    	const dispatch = createEventDispatcher();

    	const estimateUpdated = () => {
    		dispatch("estimateUpdated", {});
    	};

    	const prePlan = template => {
    		// Go through each team member.
    		team.forEach((member, i) => {
    			const fullDay = template.full.indexOf(member.role) > -1;

    			// Go through each day of the week.
    			Object.keys(member.week).forEach((dow, j) => {
    				const am = 4;
    				const pm = fullDay ? 4 : 0;

    				if (j < template.days) {
    					$$invalidate(0, team[i].week[dow].am = am, team);
    					$$invalidate(0, team[i].week[dow].pm = pm, team);
    				} else {
    					$$invalidate(0, team[i].week[dow].am = 0, team);
    					$$invalidate(0, team[i].week[dow].pm = 0, team);
    				}
    			});
    		});

    		estimateUpdated();
    	};

    	const writable_props = ["team"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Plan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Plan", $$slots, []);
    	const click_handler = template => prePlan(template);

    	$$self.$set = $$props => {
    		if ("team" in $$props) $$invalidate(0, team = $$props.team);
    	};

    	$$self.$capture_state = () => ({
    		team,
    		WeekBlocks,
    		Templates,
    		selected,
    		createEventDispatcher,
    		dispatch,
    		estimateUpdated,
    		prePlan
    	});

    	$$self.$inject_state = $$props => {
    		if ("team" in $$props) $$invalidate(0, team = $$props.team);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [team, estimateUpdated, prePlan, dispatch, click_handler];
    }

    class Plan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { team: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Plan",
    			options,
    			id: create_fragment$4.name
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

    const file$5 = "src/Summary.svelte";

    function create_fragment$5(ctx) {
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
    			t6 = text("Förväntad kostnad är ");
    			span2 = element("span");
    			t7 = text(t7_value);
    			t8 = text(" kr i veckan.");
    			attr_dev(span0, "class", "highlight");
    			add_location(span0, file$5, 5, 22, 67);
    			attr_dev(span1, "class", "highlight");
    			add_location(span1, file$5, 5, 99, 144);
    			add_location(p0, file$5, 4, 0, 41);
    			attr_dev(span2, "class", "highlight");
    			add_location(span2, file$5, 8, 23, 240);
    			add_location(p1, file$5, 7, 0, 213);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*summary*/ 1 && t1_value !== (t1_value = /*summary*/ ctx[0].roles + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*summary*/ 1 && t3_value !== (t3_value = /*summary*/ ctx[0].hours + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*summary*/ 1 && t7_value !== (t7_value = /*summary*/ ctx[0].rate + "")) set_data_dev(t7, t7_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p1);
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { summary: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Summary",
    			options,
    			id: create_fragment$5.name
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

    const { Object: Object_1$1 } = globals;
    const file$6 = "src/Team.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (28:1) {#each Object.keys(roles) as role}
    function create_each_block_1$1(ctx) {
    	let button;
    	let t_value = /*role*/ ctx[10] + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*role*/ ctx[10], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "available svelte-1b3xcc3");
    			add_location(button, file$6, 28, 2, 509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    			dispose = listen_dev(button, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*roles*/ 1 && t_value !== (t_value = /*role*/ ctx[10] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(28:1) {#each Object.keys(roles) as role}",
    		ctx
    	});

    	return block;
    }

    // (33:0) {#if memberCount < 1}
    function create_if_block$1(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let each_value = Object.keys(Templates.Teams);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Eller välj ett färdigt team.";
    			t1 = space();
    			p1 = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(p0, file$6, 33, 1, 618);
    			add_location(p1, file$6, 36, 1, 660);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p1, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*addTemplate, Object, Templates*/ 8) {
    				each_value = Object.keys(Templates.Teams);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(33:0) {#if memberCount < 1}",
    		ctx
    	});

    	return block;
    }

    // (38:2) {#each Object.keys(Templates.Teams) as template}
    function create_each_block$1(ctx) {
    	let button;
    	let t_value = /*template*/ ctx[7] + "";
    	let t;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[6](/*template*/ ctx[7], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "available svelte-1b3xcc3");
    			add_location(button, file$6, 38, 3, 718);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    			dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
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
    		source: "(38:2) {#each Object.keys(Templates.Teams) as template}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let if_block_anchor;
    	let each_value_1 = Object.keys(/*roles*/ ctx[0]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let if_block = /*memberCount*/ ctx[1] < 1 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Klicka på önskade roller för att lägga till dem i teamet.";
    			t1 = space();
    			p1 = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(p0, file$6, 23, 0, 399);
    			add_location(p1, file$6, 26, 0, 467);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p1, null);
    			}

    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*add, Object, roles*/ 5) {
    				each_value_1 = Object.keys(/*roles*/ ctx[0]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*memberCount*/ ctx[1] < 1) {
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
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { roles } = $$props;
    	let { memberCount } = $$props;
    	const dispatch = createEventDispatcher();

    	const add = role => {
    		dispatch("addRole", { role });
    	};

    	const addTemplate = template => {
    		Templates.Teams[template].forEach(role => {
    			dispatch("addRole", { role });
    		});
    	};

    	const writable_props = ["roles", "memberCount"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Team> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Team", $$slots, []);

    	const click_handler = role => {
    		add(role);
    	};

    	const click_handler_1 = template => addTemplate(template);

    	$$self.$set = $$props => {
    		if ("roles" in $$props) $$invalidate(0, roles = $$props.roles);
    		if ("memberCount" in $$props) $$invalidate(1, memberCount = $$props.memberCount);
    	};

    	$$self.$capture_state = () => ({
    		roles,
    		memberCount,
    		Templates,
    		createEventDispatcher,
    		dispatch,
    		add,
    		addTemplate
    	});

    	$$self.$inject_state = $$props => {
    		if ("roles" in $$props) $$invalidate(0, roles = $$props.roles);
    		if ("memberCount" in $$props) $$invalidate(1, memberCount = $$props.memberCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [roles, memberCount, add, addTemplate, dispatch, click_handler, click_handler_1];
    }

    class Team$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { roles: 0, memberCount: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Team",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*roles*/ ctx[0] === undefined && !("roles" in props)) {
    			console.warn("<Team> was created without expected prop 'roles'");
    		}

    		if (/*memberCount*/ ctx[1] === undefined && !("memberCount" in props)) {
    			console.warn("<Team> was created without expected prop 'memberCount'");
    		}
    	}

    	get roles() {
    		throw new Error("<Team>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set roles(value) {
    		throw new Error("<Team>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get memberCount() {
    		throw new Error("<Team>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set memberCount(value) {
    		throw new Error("<Team>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Week.svelte generated by Svelte v3.19.2 */

    const file$7 = "src/Week.svelte";

    function create_fragment$7(ctx) {
    	let span2;
    	let t0;
    	let br0;
    	let t1;
    	let span0;
    	let t2_value = /*week*/ ctx[0].mon.am.hours + "";
    	let t2;
    	let span0_class_value;
    	let br1;
    	let t3;
    	let span1;
    	let t4_value = /*week*/ ctx[0].mon.pm.hours + "";
    	let t4;
    	let span1_class_value;
    	let br2;
    	let t5;
    	let span5;
    	let t6;
    	let br3;
    	let t7;
    	let span3;
    	let t8_value = /*week*/ ctx[0].tue.am.hours + "";
    	let t8;
    	let span3_class_value;
    	let br4;
    	let t9;
    	let span4;
    	let t10_value = /*week*/ ctx[0].tue.pm.hours + "";
    	let t10;
    	let span4_class_value;
    	let br5;
    	let t11;
    	let span8;
    	let t12;
    	let br6;
    	let t13;
    	let span6;
    	let t14_value = /*week*/ ctx[0].wed.am.hours + "";
    	let t14;
    	let span6_class_value;
    	let br7;
    	let t15;
    	let span7;
    	let t16_value = /*week*/ ctx[0].wed.pm.hours + "";
    	let t16;
    	let span7_class_value;
    	let br8;
    	let t17;
    	let span11;
    	let t18;
    	let br9;
    	let t19;
    	let span9;
    	let t20_value = /*week*/ ctx[0].thu.am.hours + "";
    	let t20;
    	let span9_class_value;
    	let br10;
    	let t21;
    	let span10;
    	let t22_value = /*week*/ ctx[0].thu.pm.hours + "";
    	let t22;
    	let span10_class_value;
    	let br11;
    	let t23;
    	let span14;
    	let t24;
    	let br12;
    	let t25;
    	let span12;
    	let t26_value = /*week*/ ctx[0].fri.am.hours + "";
    	let t26;
    	let span12_class_value;
    	let br13;
    	let t27;
    	let span13;
    	let t28_value = /*week*/ ctx[0].fri.pm.hours + "";
    	let t28;
    	let span13_class_value;
    	let br14;

    	const block = {
    		c: function create() {
    			span2 = element("span");
    			t0 = text("Måndag");
    			br0 = element("br");
    			t1 = space();
    			span0 = element("span");
    			t2 = text(t2_value);
    			br1 = element("br");
    			t3 = space();
    			span1 = element("span");
    			t4 = text(t4_value);
    			br2 = element("br");
    			t5 = space();
    			span5 = element("span");
    			t6 = text("Tisdag");
    			br3 = element("br");
    			t7 = space();
    			span3 = element("span");
    			t8 = text(t8_value);
    			br4 = element("br");
    			t9 = space();
    			span4 = element("span");
    			t10 = text(t10_value);
    			br5 = element("br");
    			t11 = space();
    			span8 = element("span");
    			t12 = text("Onsdag");
    			br6 = element("br");
    			t13 = space();
    			span6 = element("span");
    			t14 = text(t14_value);
    			br7 = element("br");
    			t15 = space();
    			span7 = element("span");
    			t16 = text(t16_value);
    			br8 = element("br");
    			t17 = space();
    			span11 = element("span");
    			t18 = text("Torsdag");
    			br9 = element("br");
    			t19 = space();
    			span9 = element("span");
    			t20 = text(t20_value);
    			br10 = element("br");
    			t21 = space();
    			span10 = element("span");
    			t22 = text(t22_value);
    			br11 = element("br");
    			t23 = space();
    			span14 = element("span");
    			t24 = text("Fredag");
    			br12 = element("br");
    			t25 = space();
    			span12 = element("span");
    			t26 = text(t26_value);
    			br13 = element("br");
    			t27 = space();
    			span13 = element("span");
    			t28 = text(t28_value);
    			br14 = element("br");
    			add_location(br0, file$7, 5, 8, 69);
    			attr_dev(span0, "class", span0_class_value = /*week*/ ctx[0].mon.am.hours > 0 ? "highlight" : "");
    			add_location(span0, file$7, 6, 2, 78);
    			add_location(br1, file$7, 6, 83, 159);
    			attr_dev(span1, "class", span1_class_value = /*week*/ ctx[0].mon.pm.hours > 0 ? "highlight" : "");
    			add_location(span1, file$7, 7, 2, 168);
    			add_location(br2, file$7, 7, 83, 249);
    			attr_dev(span2, "class", "weekday svelte-1yluarq");
    			add_location(span2, file$7, 4, 0, 38);
    			add_location(br3, file$7, 10, 8, 295);
    			attr_dev(span3, "class", span3_class_value = /*week*/ ctx[0].tue.am.hours > 0 ? "highlight" : "");
    			add_location(span3, file$7, 11, 2, 304);
    			add_location(br4, file$7, 11, 83, 385);
    			attr_dev(span4, "class", span4_class_value = /*week*/ ctx[0].tue.pm.hours > 0 ? "highlight" : "");
    			add_location(span4, file$7, 12, 2, 394);
    			add_location(br5, file$7, 12, 83, 475);
    			attr_dev(span5, "class", "weekday svelte-1yluarq");
    			add_location(span5, file$7, 9, 0, 264);
    			add_location(br6, file$7, 15, 8, 521);
    			attr_dev(span6, "class", span6_class_value = /*week*/ ctx[0].wed.am.hours > 0 ? "highlight" : "");
    			add_location(span6, file$7, 16, 2, 530);
    			add_location(br7, file$7, 16, 83, 611);
    			attr_dev(span7, "class", span7_class_value = /*week*/ ctx[0].wed.pm.hours > 0 ? "highlight" : "");
    			add_location(span7, file$7, 17, 2, 620);
    			add_location(br8, file$7, 17, 83, 701);
    			attr_dev(span8, "class", "weekday svelte-1yluarq");
    			add_location(span8, file$7, 14, 0, 490);
    			add_location(br9, file$7, 20, 9, 748);
    			attr_dev(span9, "class", span9_class_value = /*week*/ ctx[0].thu.am.hours > 0 ? "highlight" : "");
    			add_location(span9, file$7, 21, 2, 757);
    			add_location(br10, file$7, 21, 83, 838);
    			attr_dev(span10, "class", span10_class_value = /*week*/ ctx[0].thu.pm.hours > 0 ? "highlight" : "");
    			add_location(span10, file$7, 22, 2, 847);
    			add_location(br11, file$7, 22, 83, 928);
    			attr_dev(span11, "class", "weekday svelte-1yluarq");
    			add_location(span11, file$7, 19, 0, 716);
    			add_location(br12, file$7, 25, 8, 974);
    			attr_dev(span12, "class", span12_class_value = /*week*/ ctx[0].fri.am.hours > 0 ? "highlight" : "");
    			add_location(span12, file$7, 26, 2, 983);
    			add_location(br13, file$7, 26, 83, 1064);
    			attr_dev(span13, "class", span13_class_value = /*week*/ ctx[0].fri.pm.hours > 0 ? "highlight" : "");
    			add_location(span13, file$7, 27, 2, 1073);
    			add_location(br14, file$7, 27, 83, 1154);
    			attr_dev(span14, "class", "weekday svelte-1yluarq");
    			add_location(span14, file$7, 24, 0, 943);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t0);
    			append_dev(span2, br0);
    			append_dev(span2, t1);
    			append_dev(span2, span0);
    			append_dev(span0, t2);
    			append_dev(span2, br1);
    			append_dev(span2, t3);
    			append_dev(span2, span1);
    			append_dev(span1, t4);
    			append_dev(span2, br2);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span5, anchor);
    			append_dev(span5, t6);
    			append_dev(span5, br3);
    			append_dev(span5, t7);
    			append_dev(span5, span3);
    			append_dev(span3, t8);
    			append_dev(span5, br4);
    			append_dev(span5, t9);
    			append_dev(span5, span4);
    			append_dev(span4, t10);
    			append_dev(span5, br5);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, span8, anchor);
    			append_dev(span8, t12);
    			append_dev(span8, br6);
    			append_dev(span8, t13);
    			append_dev(span8, span6);
    			append_dev(span6, t14);
    			append_dev(span8, br7);
    			append_dev(span8, t15);
    			append_dev(span8, span7);
    			append_dev(span7, t16);
    			append_dev(span8, br8);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, span11, anchor);
    			append_dev(span11, t18);
    			append_dev(span11, br9);
    			append_dev(span11, t19);
    			append_dev(span11, span9);
    			append_dev(span9, t20);
    			append_dev(span11, br10);
    			append_dev(span11, t21);
    			append_dev(span11, span10);
    			append_dev(span10, t22);
    			append_dev(span11, br11);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, span14, anchor);
    			append_dev(span14, t24);
    			append_dev(span14, br12);
    			append_dev(span14, t25);
    			append_dev(span14, span12);
    			append_dev(span12, t26);
    			append_dev(span14, br13);
    			append_dev(span14, t27);
    			append_dev(span14, span13);
    			append_dev(span13, t28);
    			append_dev(span14, br14);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*week*/ 1 && t2_value !== (t2_value = /*week*/ ctx[0].mon.am.hours + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*week*/ 1 && span0_class_value !== (span0_class_value = /*week*/ ctx[0].mon.am.hours > 0 ? "highlight" : "")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*week*/ 1 && t4_value !== (t4_value = /*week*/ ctx[0].mon.pm.hours + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*week*/ 1 && span1_class_value !== (span1_class_value = /*week*/ ctx[0].mon.pm.hours > 0 ? "highlight" : "")) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (dirty & /*week*/ 1 && t8_value !== (t8_value = /*week*/ ctx[0].tue.am.hours + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*week*/ 1 && span3_class_value !== (span3_class_value = /*week*/ ctx[0].tue.am.hours > 0 ? "highlight" : "")) {
    				attr_dev(span3, "class", span3_class_value);
    			}

    			if (dirty & /*week*/ 1 && t10_value !== (t10_value = /*week*/ ctx[0].tue.pm.hours + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*week*/ 1 && span4_class_value !== (span4_class_value = /*week*/ ctx[0].tue.pm.hours > 0 ? "highlight" : "")) {
    				attr_dev(span4, "class", span4_class_value);
    			}

    			if (dirty & /*week*/ 1 && t14_value !== (t14_value = /*week*/ ctx[0].wed.am.hours + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*week*/ 1 && span6_class_value !== (span6_class_value = /*week*/ ctx[0].wed.am.hours > 0 ? "highlight" : "")) {
    				attr_dev(span6, "class", span6_class_value);
    			}

    			if (dirty & /*week*/ 1 && t16_value !== (t16_value = /*week*/ ctx[0].wed.pm.hours + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*week*/ 1 && span7_class_value !== (span7_class_value = /*week*/ ctx[0].wed.pm.hours > 0 ? "highlight" : "")) {
    				attr_dev(span7, "class", span7_class_value);
    			}

    			if (dirty & /*week*/ 1 && t20_value !== (t20_value = /*week*/ ctx[0].thu.am.hours + "")) set_data_dev(t20, t20_value);

    			if (dirty & /*week*/ 1 && span9_class_value !== (span9_class_value = /*week*/ ctx[0].thu.am.hours > 0 ? "highlight" : "")) {
    				attr_dev(span9, "class", span9_class_value);
    			}

    			if (dirty & /*week*/ 1 && t22_value !== (t22_value = /*week*/ ctx[0].thu.pm.hours + "")) set_data_dev(t22, t22_value);

    			if (dirty & /*week*/ 1 && span10_class_value !== (span10_class_value = /*week*/ ctx[0].thu.pm.hours > 0 ? "highlight" : "")) {
    				attr_dev(span10, "class", span10_class_value);
    			}

    			if (dirty & /*week*/ 1 && t26_value !== (t26_value = /*week*/ ctx[0].fri.am.hours + "")) set_data_dev(t26, t26_value);

    			if (dirty & /*week*/ 1 && span12_class_value !== (span12_class_value = /*week*/ ctx[0].fri.am.hours > 0 ? "highlight" : "")) {
    				attr_dev(span12, "class", span12_class_value);
    			}

    			if (dirty & /*week*/ 1 && t28_value !== (t28_value = /*week*/ ctx[0].fri.pm.hours + "")) set_data_dev(t28, t28_value);

    			if (dirty & /*week*/ 1 && span13_class_value !== (span13_class_value = /*week*/ ctx[0].fri.pm.hours > 0 ? "highlight" : "")) {
    				attr_dev(span13, "class", span13_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span5);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(span8);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(span11);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(span14);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { week } = $$props;
    	const writable_props = ["week"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Week> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Week", $$slots, []);

    	$$self.$set = $$props => {
    		if ("week" in $$props) $$invalidate(0, week = $$props.week);
    	};

    	$$self.$capture_state = () => ({ week });

    	$$self.$inject_state = $$props => {
    		if ("week" in $$props) $$invalidate(0, week = $$props.week);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [week];
    }

    class Week extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { week: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Week",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*week*/ ctx[0] === undefined && !("week" in props)) {
    			console.warn("<Week> was created without expected prop 'week'");
    		}
    	}

    	get week() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set week(value) {
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

    /* src/Calculator.svelte generated by Svelte v3.19.2 */

    const { Object: Object_1$2 } = globals;
    const file$8 = "src/Calculator.svelte";

    // (132:0) {:else}
    function create_else_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Här kommer du att se prisexempel för teamet du sätter ihop!";
    			add_location(p, file$8, 132, 1, 2253);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(132:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (129:0) {#if summary.roles > 0 && summary.hours > 0}
    function create_if_block$2(ctx) {
    	let h30;
    	let t1;
    	let h31;
    	let current;

    	const summary_1 = new Summary({
    			props: { summary: /*summary*/ ctx[1] },
    			$$inline: true
    		});

    	const week_1 = new Week({
    			props: { week: /*week*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			h30.textContent = "Vad kostar det?";
    			create_component(summary_1.$$.fragment);
    			t1 = space();
    			h31 = element("h3");
    			h31.textContent = "Hur ser veckorna ut?";
    			create_component(week_1.$$.fragment);
    			add_location(h30, file$8, 129, 1, 2139);
    			add_location(h31, file$8, 130, 1, 2194);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			mount_component(summary_1, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h31, anchor);
    			mount_component(week_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const summary_1_changes = {};
    			if (dirty & /*summary*/ 2) summary_1_changes.summary = /*summary*/ ctx[1];
    			summary_1.$set(summary_1_changes);
    			const week_1_changes = {};
    			if (dirty & /*week*/ 1) week_1_changes.week = /*week*/ ctx[0];
    			week_1.$set(week_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(summary_1.$$.fragment, local);
    			transition_in(week_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(summary_1.$$.fragment, local);
    			transition_out(week_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			destroy_component(summary_1, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h31);
    			destroy_component(week_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(129:0) {#if summary.roles > 0 && summary.hours > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let h20;
    	let t1;
    	let hr0;
    	let t2;
    	let t3;
    	let h21;
    	let t5;
    	let hr1;
    	let t6;
    	let t7;
    	let h22;
    	let t9;
    	let hr2;
    	let t10;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	const team_1 = new Team$1({
    			props: {
    				roles: Roles,
    				memberCount: /*team*/ ctx[2].length
    			},
    			$$inline: true
    		});

    	team_1.$on("addRole", /*addRole*/ ctx[3]);

    	const plan = new Plan({
    			props: { team: /*team*/ ctx[2] },
    			$$inline: true
    		});

    	plan.$on("estimateUpdated", /*summarize*/ ctx[4]);
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*summary*/ ctx[1].roles > 0 && /*summary*/ ctx[1].hours > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			h20 = element("h2");
    			h20.textContent = "Team";
    			t1 = space();
    			hr0 = element("hr");
    			t2 = space();
    			create_component(team_1.$$.fragment);
    			t3 = space();
    			h21 = element("h2");
    			h21.textContent = "Tid";
    			t5 = space();
    			hr1 = element("hr");
    			t6 = space();
    			create_component(plan.$$.fragment);
    			t7 = space();
    			h22 = element("h2");
    			h22.textContent = "Summering";
    			t9 = space();
    			hr2 = element("hr");
    			t10 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(h20, file$8, 118, 0, 1902);
    			add_location(hr0, file$8, 119, 0, 1916);
    			add_location(h21, file$8, 122, 0, 1994);
    			add_location(hr1, file$8, 123, 0, 2007);
    			add_location(h22, file$8, 126, 0, 2067);
    			add_location(hr2, file$8, 127, 0, 2086);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr0, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(team_1, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(plan, target, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, hr2, anchor);
    			insert_dev(target, t10, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const team_1_changes = {};
    			if (dirty & /*team*/ 4) team_1_changes.memberCount = /*team*/ ctx[2].length;
    			team_1.$set(team_1_changes);
    			const plan_changes = {};
    			if (dirty & /*team*/ 4) plan_changes.team = /*team*/ ctx[2];
    			plan.$set(plan_changes);
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
    			transition_in(team_1.$$.fragment, local);
    			transition_in(plan.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(team_1.$$.fragment, local);
    			transition_out(plan.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr0);
    			if (detaching) detach_dev(t2);
    			destroy_component(team_1, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t6);
    			destroy_component(plan, detaching);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(hr2);
    			if (detaching) detach_dev(t10);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Calculator> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Calculator", $$slots, []);

    	$$self.$capture_state = () => ({
    		Plan,
    		Summary,
    		Team: Team$1,
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

    class Calculator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Calculator",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Information.svelte generated by Svelte v3.19.2 */

    const { Object: Object_1$3 } = globals;
    const file$9 = "src/Information.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (7:0) {#each Object.keys(Roles) as role}
    function create_each_block$2(ctx) {
    	let h3;
    	let t0_value = /*role*/ ctx[0] + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = Roles[/*role*/ ctx[0]].description + "";
    	let t2;
    	let br0;
    	let br1;
    	let t3;
    	let span;
    	let t4;
    	let t5_value = Roles[/*role*/ ctx[0]].rate + "";
    	let t5;
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			br0 = element("br");
    			br1 = element("br");
    			t3 = space();
    			span = element("span");
    			t4 = text("Timtaxa: ");
    			t5 = text(t5_value);
    			t6 = text(" kr/h");
    			t7 = space();
    			add_location(h3, file$9, 7, 2, 126);
    			add_location(br0, file$9, 9, 29, 177);
    			add_location(br1, file$9, 9, 35, 183);
    			attr_dev(span, "class", "highlight");
    			add_location(span, file$9, 10, 4, 194);
    			add_location(p, file$9, 8, 2, 144);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    			append_dev(p, br0);
    			append_dev(p, br1);
    			append_dev(p, t3);
    			append_dev(p, span);
    			append_dev(span, t4);
    			append_dev(span, t5);
    			append_dev(span, t6);
    			append_dev(p, t7);
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
    		source: "(7:0) {#each Object.keys(Roles) as role}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let h2;
    	let t1;
    	let hr;
    	let t2;
    	let each_1_anchor;
    	let each_value = Object.keys(Roles);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Information";
    			t1 = space();
    			hr = element("hr");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h2, file$9, 4, 0, 61);
    			add_location(hr, file$9, 5, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
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
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Information> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Information", $$slots, []);
    	$$self.$capture_state = () => ({ Roles });
    	return [];
    }

    class Information extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Information",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/Menu.svelte generated by Svelte v3.19.2 */
    const file$a = "src/Menu.svelte";

    function create_fragment$a(ctx) {
    	let button0;
    	let t0;
    	let button0_class_value;
    	let t1;
    	let button1;
    	let t2;
    	let button1_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			t0 = text("Sätt ihop ett team");
    			t1 = space();
    			button1 = element("button");
    			t2 = text("Läs mer");
    			attr_dev(button0, "class", button0_class_value = "" + (null_to_empty(/*view*/ ctx[0] === "Calculator" ? "active" : "") + " svelte-6psexy"));
    			add_location(button0, file$a, 16, 0, 258);
    			attr_dev(button1, "class", button1_class_value = "" + (null_to_empty(/*view*/ ctx[0] === "Information" ? "active" : "") + " svelte-6psexy"));
    			add_location(button1, file$a, 17, 0, 381);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, t2);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*view*/ 1 && button0_class_value !== (button0_class_value = "" + (null_to_empty(/*view*/ ctx[0] === "Calculator" ? "active" : "") + " svelte-6psexy"))) {
    				attr_dev(button0, "class", button0_class_value);
    			}

    			if (dirty & /*view*/ 1 && button1_class_value !== (button1_class_value = "" + (null_to_empty(/*view*/ ctx[0] === "Information" ? "active" : "") + " svelte-6psexy"))) {
    				attr_dev(button1, "class", button1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { view } = $$props;

    	const select = view => {
    		dispatch("selectView", { view });
    	};

    	const buttonClass = view => {
    		return "meow";
    	};

    	const writable_props = ["view"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Menu", $$slots, []);
    	const click_handler = () => select("Calculator");
    	const click_handler_1 = () => select("Information");

    	$$self.$set = $$props => {
    		if ("view" in $$props) $$invalidate(0, view = $$props.view);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		view,
    		select,
    		buttonClass
    	});

    	$$self.$inject_state = $$props => {
    		if ("view" in $$props) $$invalidate(0, view = $$props.view);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [view, select, dispatch, buttonClass, click_handler, click_handler_1];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { view: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*view*/ ctx[0] === undefined && !("view" in props)) {
    			console.warn("<Menu> was created without expected prop 'view'");
    		}
    	}

    	get view() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set view(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.19.2 */
    const file$b = "src/App.svelte";

    function create_fragment$b(ctx) {
    	let main;
    	let t;
    	let current;
    	const hero = new Hero({ $$inline: true });
    	const team = new Team({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(hero.$$.fragment);
    			t = space();
    			create_component(team.$$.fragment);
    			attr_dev(main, "class", "svelte-2akmpr");
    			add_location(main, file$b, 16, 0, 336);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(hero, main, null);
    			append_dev(main, t);
    			mount_component(team, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hero.$$.fragment, local);
    			transition_in(team.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hero.$$.fragment, local);
    			transition_out(team.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(hero);
    			destroy_component(team);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let view = "Calculator";

    	const selectViewEventHandler = ({ detail }) => {
    		view = detail.view;
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
    		Calculator,
    		Information,
    		Menu,
    		view,
    		selectViewEventHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("view" in $$props) view = $$props.view;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
