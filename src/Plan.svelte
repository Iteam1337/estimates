<script>
  export let team
  import WeekBlocks from './WeekBlocks.svelte'
  import { Templates } from './data/templates.js'

  const selected = 0

  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  const estimateUpdated = () => {
		dispatch('estimateUpdated', {});
  }
  
  const prePlan = template => {
    // Go through each team member.
    team.forEach((member, i) => {
      const fullDay = template.full.indexOf(member.role) > -1

      // Go through each day of the week.
      Object.keys(member.week).forEach((dow, j) => {
        const am = 4
        const pm = fullDay ? 4 : 0

        if (j < template.days) {
          team[i].week[dow].am = am
          team[i].week[dow].pm = pm
        } else {
          team[i].week[dow].am = 0
          team[i].week[dow].pm = 0
        }
      })
    })
    estimateUpdated()
  }
</script>

{#if team.length}
  <p>
    Fyll veckan med en föreslagen plan
  </p>
  <p>
    {#each Templates.Days as template}
      <button on:click={() => prePlan(template)}>{template.name}</button>
    {/each}
  </p>
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

<style>
  button {
		border: 0px;
		background-color: rgba(71, 253, 164, 1);
		margin: 0 2px;
		padding: 8px 10px;
	}
</style>