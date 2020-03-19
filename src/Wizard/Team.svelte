<script>
  export let state

  import Bubble from '../components/Bubble.svelte'
  import { Roles } from '../Data/Roles.js'

  import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

  const next = () => {
		dispatch('step', {
			step: 'Week',
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
    <Bubble alt={''} main={'0 kr'} sub={'per månad'} />
    <Bubble alt={''} main={'1337'} sub={'Teamtaxa'} />
  </div>

  <h1>Hur ser ditt drömteam ut?</h1>

  {#each Object.keys(Roles) as role, index}
    <div class="role">
      <span class="count"><input type="number" bind:value={state.team.roles[role]} /></span>
      <span class="team">
        <h2>{role}</h2>
        <span>{Roles[role].description}</span>
      </span>
    </div>
  {/each}

  <div class="navigation">
    <span></span>
    <span><button on:click={next}>Hur länge? &gt;</button></span>
  </div>
</div>