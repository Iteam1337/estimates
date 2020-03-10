<script>
	import Plan from './Plan.svelte'
	import Summary from './Summary.svelte'
	import Team from './Team.svelte'
	import Week from './Week.svelte'

	import { Roles } from './data/roles.js'

	const estimate = {}
	Object.keys(Roles).forEach(role => {
		estimate[role] = 0
	})

	const weekTemplate = {
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

	let week = JSON.parse(JSON.stringify(weekTemplate))

	const summary = {
		roles: 0,
		hours: 0,
		rate: 0,
	}

	let team = []
	const addRole = ({ detail }) => {
		team.push({
			role: detail.role,
			week: {
				mon: { am: false, pm: false },
				tue: { am: false, pm: false },
				wed: { am: false, pm: false },
				thu: { am: false, pm: false },
				fri: { am: false, pm: false },
			},
		})
		team = team // NOTE: Svelte does not trigger on array.push()
	}

	const summarize = () => {
		summary.roles = team.length

		// Reset week.
		week = JSON.parse(JSON.stringify(weekTemplate))
		
		// Reset rate.
		summary.rate = 0

		team.forEach(member => {
			Object.keys(member.week).forEach(day => {
				if (member.week[day].am) {
					week[day].am.hours += 4
					summary.rate += Roles[member.role].rate * 4
				}

				if (member.week[day].pm) {
					week[day].pm.hours += 4
					summary.rate += Roles[member.role].rate * 4
				}
			})
		})

		summary.hours = Object.keys(week).reduce((a, day) => {
			return a + week[day].am.hours + week[day].pm.hours
		}, 0)
	}
</script>

<main>
	<h1>Priskalkylator</h1>

	<h2>Roller</h2>
	<hr />
	<Team roles={Roles} on:addRole={addRole} />

	<h2>Tid</h2>
	<hr />
	<Plan team={team} on:estimateUpdated={summarize} />

	<h2>Summering</h2>
	<hr />
	<Week week={week} on:estimateUpdated={summarize} readonly={true} />
	<Summary summary={summary} />

	<h2>Information</h2>
	<hr />
	{#each Object.keys(Roles) as role}
		<h3>{role}</h3>
		<p>{Roles[role].description}</p>
	{/each}
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