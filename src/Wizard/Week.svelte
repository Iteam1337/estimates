<script>
  export let state

  import Bubble from '../components/Bubble.svelte'

  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  const next = () => {
		dispatch('step', {
			step: 'Start',
		})
  }

  const prev = () => {
		dispatch('step', {
			step: 'Team',
		})
  }
</script>

<style>
  div.bubbles {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-around;
    align-items: stretch;
    align-content: stretch;
  }

  input[type=number] {
    width: 80%;
  }

  div.role {
    margin: 20px 0;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
  }

  span.count {
    width: 20%;
    margin-top: 10px;
  }

  span.team {
    width: 70%;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
  }

  div.navigation {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: space-between;
	align-items: stretch;
  align-content: stretch;
  margin: 20px 10px;
}

div.navigation button {
  border: none;
}
</style>

<div>
  <div class="bubbles">
    <Bubble alt={''} main={'1337'} sub={'Teamtaxa'} />
    <Bubble alt={''} main={'1 dag'} sub={'i veckan'} />
  </div>

  <h1>När ska vi jobba ihop?</h1>

  {#each Object.keys(state.week) as day, index}
    <div class="role">
      <span class="count"><input type="number" bind:value={state.week[day]} /></span>
      <span class="team">
        <h2>{day}</h2>
      </span>
    </div>
  {/each}

  <div class="navigation">
    <span><button on:click={prev}>&lt; Vad behöver du?</button></span>
    <span><button on:click={next}>Hur länge? &gt;</button></span>
  </div>
</div>