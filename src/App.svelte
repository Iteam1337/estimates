<script>
	import { Roles } from './data/roles.js'
	
	const estimate = {}
	Object.keys(Roles).forEach(role => {
		estimate[role] = 0
	})

	const week = {
		mon: {
			tick: 0,
			tock: 0,
		},
		tue: {
			tick: 0,
			tock: 0,
		},
		wed: {
			tick: 0,
			tock: 0,
		},
		thu: {
			tick: 0,
			tock: 0,
		},
		fri: {
			tick: 0,
			tock: 0,
		},
	}
</script>

<main>
	<h1>Team Estimator</h1>

	<hr />
	<h2>Roles</h2>
	{#each Object.keys(Roles) as role, i}
		{role}: <input type="number" bind:value={estimate[role]} />
		{#if i+1 % 3 === 3}
			<br />
		{/if}
	{/each}

	<hr />
	<h3>Weekly schedule</h3>
	<div>
		<span class="weekday">
			Måndag<br />
			<input type="number" bind:value={week.mon.tick} /><br />
			<input type="number" bind:value={week.mon.tock} /><br />
		</span>
		<span class="weekday">
			Tisdag<br />
			<input type="number" bind:value={week.tue.tick} /><br />
			<input type="number" bind:value={week.tue.tock} /><br />
		</span>
		<span class="weekday">
			Onsdag<br />
			<input type="number" bind:value={week.wed.tick} /><br />
			<input type="number" bind:value={week.wed.tock} /><br />
		</span>
		<span class="weekday">
			Torsdag<br />
			<input type="number" bind:value={week.thu.tick} /><br />
			<input type="number" bind:value={week.thu.tock} /><br />
		</span>
		<span class="weekday">
			Fredag<br />
			<input type="number" bind:value={week.fri.tick} /><br />
			<input type="number" bind:value={week.fri.tock} /><br />
		</span>
	</div>
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