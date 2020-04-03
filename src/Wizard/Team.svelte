<script>
  export let state

  import Bubble from '../components/Bubble.svelte'
  import Alert from '../components/Alert.svelte'
  import { Roles } from '../Data/Roles.js'

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  const next = () => {
    dispatch('step', {
      step: 'Week',
    })
  }

  let teamCoachWarningVisible = false

  const addRole = () => {
    if (state.team.roles[roleSelectedToAdd]) {
      state.team.roles[roleSelectedToAdd]++
    } else {
      state.team.roles[roleSelectedToAdd] = 1
    }

    const addedRoles = Object.keys(state.team.roles)
    let toggleTeamCoachWarning = false

    if (addedRoles.length > 0) {
      toggleTeamCoachWarning = true
    }

    addedRoles.forEach(role => {
      if (role === 'TeamCoach') {
        toggleTeamCoachWarning = false
      }
    })

    teamCoachWarningVisible = toggleTeamCoachWarning

    dispatch('teamUpdated', {})
  }

  let roleSelectedToAdd
</script>

<style>
  input[type='number'] {
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
</style>

<div>
  <h1>Hur ser ditt drömteam ut?</h1>

  {#each Object.keys(state.team.roles) as role}
    <div class="role">
      <span class="count">
        <input type="number" bind:value={state.team.roles[role]} />
      </span>
      <span class="team">
        <h2>{role}</h2>
        <span>{Roles[role].description}</span>
      </span>
    </div>
  {/each}

  <select bind:value={roleSelectedToAdd}>
    {#each Object.keys(Roles) as role, index}
      <option id={role}>{role}</option>
    {/each}
  </select>
  <button on:click={addRole}>Lägg till roll</button>

  {#if teamCoachWarningVisible}
    <Alert
      heading={'Kom ihåg teamcoachen!'}
      text={'Varje team behöver ha en teamcoach. Det är en viktig roll som både stöttar dig och teamet i att få ett effektivt och kreativt arbetssätt.'} />
  {/if}
</div>
