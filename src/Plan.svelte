<script>
  export let team
	import WeekBlocks from './WeekBlocks.svelte'
  const selected = 0

  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  const estimateUpdated = () => {
		dispatch('estimateUpdated', {});
	}
</script>

{#if team.length}
  {#each team as member}
    <h3>{member.role}</h3>
    <WeekBlocks week={member.week} on:estimateUpdated={estimateUpdated} />
    <br />
  {/each}
{:else}
  <p>
    Lägg till roller i ditt team för att börja titta på hur veckorna kan se ut.
  </p>
{/if}
