<script>
  export let state
</script>

{#if state.summary.hourly}
  <p>Teamtaxa: {state.summary.hourly} kr/h</p>
  <p>Månadskostnad: {state.summary.monthly}</p>
{/if}
