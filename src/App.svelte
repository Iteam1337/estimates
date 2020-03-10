<script>
	import Team from './Team.svelte'
	import Week from './Week.svelte'

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
	<h1>Priskalkylator</h1>

	<h2>Roller</h2>
	<hr />
	<Team estimate={estimate} roles={Roles} on:estimateUpdated={summarize} />

	<h2>Vecka</h2>
	<hr />
	<Week week={week} on:estimateUpdated={summarize} />

	<h2>Summering</h2>
	<hr />
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

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>