<script>
	import Team from './Team.svelte'
	import { Roles } from './data/roles.js'
	import { Rate } from './data/rate.js'

	const estimate = {}
	Object.keys(Roles).forEach(role => {
		estimate[role] = 0
	})

	const week = {
		mon: {
			am: {
				tt: 'tick',
				hours: 0,
			},
			pm: {
				tt: 'tick',
				hours: 0,
			},
		},
		tue: {
			am: {
				tt: 'tick',
				hours: 0,
			},
			pm: {
				tt: 'tick',
				hours: 0,
			},
		},
		wed: {
			am: {
				tt: 'tick',
				hours: 0,
			},
			pm: {
				tt: 'tock',
				hours: 0,
			},
		},
		thu: {
			am: {
				tt: 'tock',
				hours: 0,
			},
			pm: {
				tt: 'tock',
				hours: 0,
			},
		},
		fri: {
			am: {
				tt: 'tock',
				hours: 0,
			},
			pm: {
				tt: 'tock',
				hours: 0,
			},
		},
	}

	const summary = {
		roles: 0,
		hours: 0,
		rate: 0,
	}

	const validateRole = e => {
		// TODO: Validate input.
		summarize()
	}

	const summarize = () => {
		summary.roles = Object.keys(estimate).reduce((a, role) => {
			return a + estimate[role]
		}, 0)

		summary.hours = Object.keys(week).reduce((a, day) => {
			return a + week[day].am.hours * 4 + week[day].pm.hours * 4
		}, 0)

		summary.rate = summary.hours * Rate
	}
</script>

<main>
	<h1>Estimat</h1>

	<hr />
	<h2>Roller</h2>
	<Team estimate={estimate} roles={Roles} on:estimateUpdated={summarize} />

	<hr />
	<h2>Vecka</h2>
	<div>
		<span class="weekday">
			Måndag<br />
			<input type="number" bind:value={week.mon.am.hours} on:change={summarize} /><br />
			<input type="number" bind:value={week.mon.pm.hours} on:change={summarize} /><br />
		</span>
		<span class="weekday">
			Tisdag<br />
			<input type="number" bind:value={week.tue.am.hours} on:change={summarize} /><br />
			<input type="number" bind:value={week.tue.pm.hours} on:change={summarize} /><br />
		</span>
		<span class="weekday">
			Onsdag<br />
			<input type="number" bind:value={week.wed.am.hours} on:change={summarize} /><br />
			<input type="number" bind:value={week.wed.pm.hours} on:change={summarize} /><br />
		</span>
		<span class="weekday">
			Torsdag<br />
			<input type="number" bind:value={week.thu.am.hours} on:change={summarize} /><br />
			<input type="number" bind:value={week.thu.pm.hours} on:change={summarize} /><br />
		</span>
		<span class="weekday">
			Fredag<br />
			<input type="number" bind:value={week.fri.am.hours} on:change={summarize} /><br />
			<input type="number" bind:value={week.fri.pm.hours} on:change={summarize} /><br />
		</span>
	</div>

	<hr />
	<h2>Summering</h2>
	<p>
		Valt team består av {summary.roles} roller som tillsammans lägger {summary.hours} timmar i veckan.
	</p>
	<p>
		Förväntad månadskostnad är {summary.rate} kr i veckan.
	</p>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
	}

	input[type=number] {
		width: 100px;
	}

	span.weekday {
		display: inline-block;
		margin: 2px 4px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>