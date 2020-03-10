<script>
  export let estimate
  export let roles

  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  const validateRole = e => {
    // TODO: Validate input.
		dispatch('estimateUpdated', {});
	}
</script>

{#each Object.keys(roles) as role, i}
		<span class="role">
			{role}<br/><input type="number" bind:value={estimate[role]} on:change={validateRole} />
		</span>
	{/each}

<style>
  input[type=number] {
		width: 110px;
	}

	span.role {
		display: inline-block;
		margin: 0 10px;
	}
  </style>