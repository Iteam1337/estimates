<script>
	export let roles
	export let memberCount

  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  const add = role => {
		dispatch('addRole', {
			role
		})
	}

	const addTemplate = template => {
		templates[template].forEach(role => {
			dispatch('addRole', {
				role
			})
		})
	}

	const templates = {
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
	}
</script>

<p>
	Klicka på önskade roller för att lägga till dem i teamet.
</p>
<p>
	{#each Object.keys(roles) as role}
		<button class="available" on:click={() => {add(role)}}>{role}</button>
	{/each}
</p>

{#if memberCount < 1}
	<p>
		Eller välj ett färdigt team.
	</p>
	<p>
		{#each Object.keys(templates) as template}
			<button class="available" on:click={() => addTemplate(template)}>{template}</button>
		{/each}
	</p>
{/if}

<style>
  button {
		border: 0px;
		background-color: rgba(71, 253, 164, 1);
		margin: 0 2px;
		padding: 8px 10px;
	}
</style>