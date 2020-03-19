<script>
  export let state

  import Bubble from './components/Bubble.svelte'
</script>

<div>
  {#if state.step === 'Team'}
    <Bubble alt={''} main={state.summary.monthly + ' kr'} sub={'per månad'} />
  {/if}

  {#if state.step === 'Team' || state.step === 'Week'}
    <Bubble alt={''} main={state.summary.hourly} sub={'Teamtaxa'} />
  {/if}

  {#if state.step === 'Week' || state.step === 'Plan'}
    <Bubble alt={''} main={state.summary.days + ' dagar'} sub={'i veckan'} />
  {/if}
</div>

<style>
  div {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-around;
    align-items: stretch;
    align-content: stretch;
  }

  @media (max-width: 640px) {
	}
</style>