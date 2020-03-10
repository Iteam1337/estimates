<script>
	import { Roles } from './data/roles.js'
	
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
</script>

<main>
	<h1>Estimat</h1>

	<hr />
	<h2>Roller</h2>
	{#each Object.keys(Roles) as role, i}
		{role}: <input type="number" bind:value={estimate[role]} />
		{#if i+1 % 3 === 3}
			<br />
		{/if}
	{/each}

	<hr />
	<h3>Vecka</h3>
	<div>
		<button>Tick</button>
		<button>Tock</button>
	</div>
	<div>
		<span class="weekday">
			Måndag<br />
			<input type="number" bind:value={week.mon.am.hours} /><br />
			<input type="number" bind:value={week.mon.pm.hours} /><br />
		</span>
		<span class="weekday">
			Tisdag<br />
			<input type="number" bind:value={week.tue.am.hours} /><br />
			<input type="number" bind:value={week.tue.pm.hours} /><br />
		</span>
		<span class="weekday">
			Onsdag<br />
			<input type="number" bind:value={week.wed.am.hours} /><br />
			<input type="number" bind:value={week.wed.pm.hours} /><br />
		</span>
		<span class="weekday">
			Torsdag<br />
			<input type="number" bind:value={week.thu.am.hours} /><br />
			<input type="number" bind:value={week.thu.pm.hours} /><br />
		</span>
		<span class="weekday">
			Fredag<br />
			<input type="number" bind:value={week.fri.am.hours} /><br />
			<input type="number" bind:value={week.fri.pm.hours} /><br />
		</span>
	</div>

	<hr />
	<h3>Summering</h3>
	<p>
		Valt team består av {summary.roles} roller som lägger {summary.hours} timmar i veckan.
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
		width: 80px;
	}

	span.weekday {
		display: inline-block;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>