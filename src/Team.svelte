<script>
  export let roles

  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  const add = role => {
		dispatch('addRole', {
			role
		})
	}
</script>

<p>
	Klicka på önskade roller för att lägga till dem i teamet.
</p>
{#each Object.keys(roles) as role}
	<button class="available" on:click={() => {add(role)}}>{role}</button>
{/each}

<style>
  button {
		border: 0px;
		background-color: rgba(71, 253, 164, 0.4);
		margin: 0 2px;
		padding: 8px 10px;
	}
</style>