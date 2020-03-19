<script>
  export let state
  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  const navigate = step => {
		dispatch('navigate', step)
  }
</script>

<div>
  {#if state.step === 'Team'}
    <span></span>
    <span><button on:click={() => navigate('Week')}>Vecka &gt;</button></span>
  {/if}

  {#if state.step === 'Week'}
    <span><button on:click={() => navigate('Team')}>&lt; Kompetens</button></span>
    <span><button on:click={() => navigate('Plan')}>Hur länge? &gt;</button></span>
  {/if}

  {#if state.step === 'Plan'}
    <span><button on:click={() => navigate('Week')}>&lt; Vecka</button></span>
    <span><button on:click={() => navigate('???')}>?? &gt;</button></span>
  {/if}
</div>

<style>
  div {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: stretch;
    align-content: stretch;
    margin: 20px 10px;
  }

  button {
    border: none;
  }
</style>